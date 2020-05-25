Hooks.on('canvasReady', () => {
    canvas.stage.addChild(new MassCombatLayer(canvas.grid.size));
});


export class MassCombatLayer extends CanvasLayer {
    constructor(gridSize) {
        super();
        this.arrows = {
            friendly: [],
            hostile: [],
            instances : []
        }
        this.gridSize = gridSize
    }

    drawArrows() {
        console.log("mass-combat | Rendering Arrows")
        this.clearArrows()
        this.arrows.friendly.forEach(arrow => {
            this.arrows.instances.push(this.addChild(new MassCombatArrow(arrow, {disposition : TOKEN_DISPOSITIONS.FRIENDLY})))
        })
        this.arrows.hostile.forEach(arrow => {
            this.arrows.instances.push(this.addChild(new MassCombatArrow(arrow, {disposition : TOKEN_DISPOSITIONS.HOSTILE})))
        })
    }

    setupArrows(targets) {
        targets = duplicate(targets)
        targets.friendly = targets.friendly.map(t => ({
                    start : {x : t.token.x/this.gridSize, y : t.token.y/this.gridSize},
                    end : {x : t.target.x/this.gridSize, y : t.target.y/this.gridSize}
                }))
        targets.hostile = targets.hostile.map(t => ({
            start : {x : t.token.x/this.gridSize, y : t.token.y/this.gridSize},
            end : {x : t.target.x/this.gridSize, y : t.target.y/this.gridSize}
        }))

        targets.friendly.forEach(arrow => {
            this.arrows.friendly.push(this._findArrowPos(arrow))
        })
        targets.hostile.forEach(arrow => {
            this.arrows.hostile.push(this._findArrowPos(arrow))
        })
    }

    _findArrowPos(arrow)
    {
        let rotation = Math.asin((arrow.start.y - arrow.end.y) / Math.sqrt((arrow.start.x - arrow.end.x)**2 + (arrow.start.y - arrow.end.y)**2))
        if (arrow.start.x - arrow.end.x > 0)
        {
            if (arrow.start.y - arrow.end.y > 0)
                rotation += (Math.PI/2)
            else if (arrow.start.y - arrow.end.y < 0)
                rotation -= (Math.PI/2)
            else 
                rotation += Math.PI
        }    
        let pos = {x : arrow.start.x * this.gridSize + this.gridSize/2, y : arrow.start.y * this.gridSize + this.gridSize/2, rotation : rotation} // Centered on the token if 0 rotation


        // pos.x += (pos.rotation/(Math.PI) * this.gridSize/2)
        // //pos.y += -(pos.rotation/(Math.PI) * this.gridSize)
        // console.log (arrow.start.x, arrow.start.y, pos.rotation, Math.abs(pos.rotation/(Math.PI) * this.gridSize))
        //pos.y += Math.abs(pos.rotation/(Math.PI) * this.gridSize/2)


        return pos
    }

    clearArrows() 
    {
        this.arrows.instances.forEach(i => i.destroy())
    }
}


class MassCombatArrow extends PIXI.Container {
    constructor(pos, options) {
        super();
        this.target = pos;
        this.x = pos.x;
        this.y = pos.y;
        this.options = options;
        this.color = options.disposition == TOKEN_DISPOSITIONS.FRIENDLY ? "0x43DFDF": "0xE72124" 
        this.draw(pos.rotation);
    }

    draw(rotation) {
        let grid = canvas.scene.data.grid;
        let arrow = PIXI.Sprite.from("modules/mass-combat/arrow.png")
        arrow.anchor.set(0.5)
        this.rotation = -1 * rotation;
        arrow.tint = this.color
        arrow.alpha = 0.5;
        arrow.width = grid/2;
        arrow.height = grid/2;
        this.addChild(arrow)
    }

    destroy()
    {
        super.destroy(this)
    }
}

