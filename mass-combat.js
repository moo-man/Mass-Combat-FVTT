import { MassCombatLayer } from "./arrows.js"

Hooks.on("renderSidebarTab", (app, html) => {
    if (game.user.isGM && app.options.id == "combat" && app.combat)
    {
        let button = $("<nav id='combat-controls' class='directory-footer'><a class='combat-control'>Mass Combat</button>")
        button.click(() => {
            game.massCombatTool.load(app.combat.getFlag("mass-combat", "combat") || {});
        })
        $(html).append(button);
    }
  })


  Hooks.on("createCombat", (combat, options, id) => {
      combat.setFlag("mass-combat", "combat", {})
  })

  Hooks.on("ready", () => {
    game.massCombatTool = new MassCombatTool();
})

class MassCombatTool extends Application {
    static get defaultOptions()
    {
        const options = super.defaultOptions;
        options.id = "mass-combat";
        options.template = "modules/mass-combat/mass-combat.html"
        options.classes.push("mass-combat");
        options.resizable = false;
        options.height = 900;
        options.width = 600;
        options.minimizable = true;
        options.title = "Mass Combat"
        return options;
    }

    constructor(app)
    {
        super(app);
    }

    load(combat)
    {
        if (combat.friendly)
            this.combat = combat;
        else 
            this.clear();
        this.save();
        this.render(true);
    }

    save()
    {
        game.combat.setFlag("mass-combat", "combat", null).then(() => game.combat.setFlag("mass-combat", "combat", this.combat)) 
    }

    clear()
    {
        this.combat = {
            friendly : [],
            hostile : [],
            targets : {}
        }
        this.save();
        this.render(true);
    }

    getData()
    {
        let data = super.getData();
        data.combat = this.combat;
        return data;
    }

    addTokens(tokens)
    {
        let allTokens = this.combat.friendly.concat(this.combat.hostile)
        tokens = tokens.filter(t => !(allTokens.find(dup => dup._id == t.data._id)))
        tokens.forEach(t => {
            if (t.data.disposition == TOKEN_DISPOSITIONS.HOSTILE)
                this.combat.hostile.push(t.data);
            else if (t.data.disposition == TOKEN_DISPOSITIONS.FRIENDLY)
                this.combat.friendly.push(t.data);
        });
        this.save();
        this.render(true);
    }

    sort()
    {
        let allTokens = this.combat.friendly.concat(this.combat.hostile);
        this.combat.friendly = [];
        this.combat.hostile = [];

        allTokens.forEach(t => {
            if (t.disposition == TOKEN_DISPOSITIONS.HOSTILE)
                this.combat.hostile.push(t);
            else if (t.disposition == TOKEN_DISPOSITIONS.FRIENDLY)
                this.combat.friendly.push(t);
        })
        this.save();
        this.render(true);
    }

    updateTokens()
    {
        let allTokens = this.combat.friendly.concat(this.combat.hostile);
        let tokensToUpdate = canvas.tokens.placeables.filter(t => allTokens.find(tokenInMass => tokenInMass._id == t.data._id))
        this.combat.friendly = [];
        this.combat.hostile = [];
        this.addTokens(tokensToUpdate)
    }

    setup()
    {
        let friendlyTargets = this.selectTargets(this.findTargets("friendly"));
        let hostileTargets = this.selectTargets(this.findTargets("hostile"));

        friendlyTargets = friendlyTargets.map(t => {return {token : this.combat.friendly.find(f => f._id == t.id), target : this.combat.hostile.find(h => h._id == t.targets)}})
        hostileTargets = hostileTargets.map(t => {return {token : this.combat.hostile.find(h => h._id == t.id), target : this.combat.friendly.find(f => f._id == t.targets)}})

        this.combat.targets = {friendly : friendlyTargets, hostile : hostileTargets}


        let massCombatArrows = canvas.layers.find(l => l.constructor.name == "MassCombatLayer")
        massCombatArrows.setupArrows(this.combat.targets)
        massCombatArrows.drawArrows()
        this.save();
        this.render(true);
    }

    findTargets(side)
    {
        let targeters = side == "friendly" ? this.combat.friendly : this.combat.hostile;
        let targets = side == "friendly" ? this.combat.hostile : this.combat.friendly;
        let targetMap  = []
        let targetHitBoxes = targets.map(t => {return {id : t._id, hitbox : this.constructHitBox(t)}})
        for (let t of targeters)
        {
            let possibleTargets  = [];
            let threatenedSquares = this.constructThreatenRange(t)
            for (let target of targetHitBoxes)
            {
                if (this.squaresOverlap(threatenedSquares, target.hitbox))
                {
                    possibleTargets.push(target.id)
                }
            }
            targetMap.push({id : t._id , targets : possibleTargets})
        }
        return targetMap
    }

    selectTargets(targetMap)
    {
        for (let actor of targetMap)
        {
            if (actor.targets.length)
                actor.targets = actor.targets[new Roll(`1d${actor.targets.length}`).roll().total-1]
        }
        return targetMap
    }

    squaresOverlap(squareA, squareB)
    {
        for(let coordA of squareA)
        {
            for (let coordB of squareB)
            {
                if (coordA.x == coordB.x && coordA.y == coordB.y)
                    return true;
            }
        }
        return false;
    }

    constructHitBox(token)
    {
        let xStart = token.x/canvas.grid.size;
        let yStart = token.y/canvas.grid.size;

        let spacesTaken = []
        
        for (let x = 0; x < token.width; x++)
        {
            for (let y = 0; y < token.height; y++)
            {
                spacesTaken.push({x: xStart + x, y: yStart + y})
            }
        }
        return spacesTaken;
    }

    constructThreatenRange(token)
    {
        let xStart = token.x/canvas.grid.size;
        let yStart = token.y/canvas.grid.size;

        let spaces = [
            {x : xStart-1, y : yStart-1},
            {x : xStart-1, y : yStart},
            {x : xStart-1, y : yStart+1},

            {x : xStart, y   : yStart-1},
            {x : xStart, y   : yStart+1},

            {x : xStart+1, y : yStart-1},
            {x : xStart+1, y : yStart},
            {x : xStart+1, y : yStart+1},
        ];
        return spaces;
    }

    activateListeners(html)
    {
        html.find(".add-token").click(ev => {
            this.addTokens(canvas.tokens.controlled);
        })
        html.find(".clear").click(ev => {
            this.clear();
        })
        html.find(".set-friendly").click(async ev => {
            let tokens = duplicate(canvas.tokens.controlled.map(i => i.data))
            tokens.forEach(t => {t.disposition = TOKEN_DISPOSITIONS.FRIENDLY})
            await canvas.tokens.updateMany(tokens);
            this.updateTokens()
        })
        html.find(".set-hostile").click(async ev => {
            let tokens = duplicate(canvas.tokens.controlled.map(i => i.data));
            tokens.forEach(t => {t.disposition = TOKEN_DISPOSITIONS.HOSTILE})
            await canvas.tokens.updateMany(tokens);
            this.updateTokens();
        })

        html.find(".setup").click(ev => {
            this.setup()
        })
    }
}