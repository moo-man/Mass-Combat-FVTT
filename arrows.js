Hooks.on('canvasReady', () => {
    canvas.stage.addChild(new MassCombatLayer(canvas.grid.size));
});


export class MassCombatLayer extends CanvasLayer {
    constructor(gridSize) {
        super();
        this.arrows = {
            friendly: [],
            hostile: []
        }
        this.gridSize = gridSize
    }

    drawArrows() {
        this.arrows.friendly.forEach(arrow => {
            this.addChild(new MassCombatArrow(arrow, {disposition : TOKEN_DISPOSITIONS.FRIENDLY}))
        })
        this.arrows.hostile.forEach(arrow => {
            this.addChild(new MassCombatArrow(arrow, {disposition : TOKEN_DISPOSITIONS.HOSTILE}))
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
            this.arrows.friendly.push(this._placeArrow(arrow))
        })
        targets.hostile.forEach(arrow => {
            this.arrows.hostile.push(this._placeArrow(arrow))
            //this.arrows.hostile.push({x : (arrow.start.x + arrow.end.x)/2 * this.gridSize, y : (arrow.start.y + arrow.end.y)/2 * this.gridSize})
        })
    }

    _placeArrow(arrow)
    {
        let rotation = Math.asin((arrow.start.y - arrow.end.y) / Math.sqrt((arrow.start.x - arrow.end.x)**2 + (arrow.start.y - arrow.end.y)**2))
        let pos = {x : arrow.start.x * this.gridSize + this.gridSize/2, y : arrow.start.y * this.gridSize + this.gridSize/2, rotation : rotation}
        return pos
    }
}


class MassCombatArrow extends PIXI.Container {
    constructor(pos, options) {
        super();
        this.target = pos;
        this.x = pos.x;
        this.y = pos.y;
        this.rotation = pos.rotation * -1
        this.options = options;
        this.color = options.disposition == TOKEN_DISPOSITIONS.FRIENDLY ? "0x43DFDF": "0xE72124" 
        this.draw();
    }

    draw() {
        let grid = canvas.scene.data.grid;
        let arrow = PIXI.Sprite.from("modules/mass-combat/arrow.png")
        arrow.tint = this.color
        arrow.alpha = 0.5;
        arrow.width = grid/2;
        arrow.height = grid/2;
        console.log(this.color);
        this.addChild(arrow)
    }
}

