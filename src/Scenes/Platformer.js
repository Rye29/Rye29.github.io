class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 700;
        this.DRAG = 1400;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1650;
        this.JUMP_VELOCITY = -705;
        this.physics.world.setBounds(0, 0, 1440*3, 40*18);
        this.PARTICLE_VELOCITY = 50;

    }

    create() {

        this.Rkey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 125 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 120, 20);
        this.coincount = 0

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("industrial_tilemap_packed", "tilemap_ground_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("platform_ground_layer", this.tileset, 0, 0);
        this.groundLayer.setScale(2.0);


        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        //setup the decor layer
        this.decorLayer = this.map.createLayer("decor_layer", this.tileset, 0, 0);
        this.decorLayer.setScale(2.0);

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(game.config.width/4, game.config.height/2, "platformer_characters", "tile_0000.png").setScale(SCALE)
        my.sprite.player.setCollideWorldBounds(true);

        //setup the death layer
        this.deathLayer = this.map.createLayer("death_layer", this.tileset, 0, 0);
        this.deathLayer.setScale(2.0);
        this.deathLayer.setCollisionByProperty({
            collides: true
        })
        this.death_collider =this.physics.add.collider(my.sprite.player, this.deathLayer, this.kill_player, null, this)

       //setup end goal
       this.goalLayer = this.map.createLayer("goal_layer", this.tileset, 0, 0)
       this.goalLayer.setScale(2.0)
       this.goalLayer.setCollisionByProperty({
        collides: true
       })
       this.goal_collider = this.physics.add.collider(my.sprite.player, this.goalLayer, this.kill_player_win, null, this)


       ///

       this.carryLayer = this.map.createLayer("moving_platform_layer", this.tileset, 0, 0);
       this.carryLayer.setScale(2.0);


        // Make it collidable
        this.carryLayer.setCollisionByProperty({
            collides: true
        });

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);
        this.physics.add.collider(my.sprite.player, this.deathLayer);
        this.physics.add.collider(my.sprite.player, this.goalLayer)
        this.physics.add.collider(my.sprite.player, this.carryLayer)

        
        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        


        //create coins
        this.coins = this.map.createFromObjects("collectibles", {
            name: "coin",
            key: "tile_map_sheet",
            frame: 151,
        });

        for(let i = 0; i<this.coins.length; i++){
            this.coins[i].x *= 2
            this.coins[i].y *= 2

        }

        this.coinGroup = this.add.group(this.coins);
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);

        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            this.coincount += 1
            obj2.destroy(); // remove coin on overlap
        });

        //sets up the camera
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels*2, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        //coin tracker text
        this.coinText = this.add.text(10, 10, 'Coins: '+this.coincount, { 
            fontFamily: 'Arial', 
            fontSize: '32px', 
            color: '#ffffff' 
        });
        this.coinText.setScrollFactor(0)



        //gameover text
        this.gameOverText = this.add.text(500, 300, "Game Over Press 'R' to restart", { 
            fontFamily: 'Arial', 
            fontSize: '32px', 
            color: '#ffffff' 
        });
        this.gameOverText.setScrollFactor(0)
        this.gameOverText.visible = false

        //jump audio
        this.jumpSFX = this.sound.add('jumpsfx', { volume: 0.5, loop: false });

        this.walking_vfx = null
        this.walking_vfx = this.add.particles(0, 0, "kenny-particles", {
            frame: ['magic_05.png', 'magic_09.png'],
            // TODO: Try: add random: true
            scale: {start: 0.03, end: 0.1},
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 350,
            // TODO: Try: gravityY: -400,
            alpha: {start: 1, end: 0.1}, 
        });
        this.walking_vfx.stop();

        this.physics.world.createDebugGraphic().clear();



        this.physics.world.drawDebug = false;
        this.physics.world.debugGraphic.clear()
    }

    update() {
        console.log(this.walking_vfx)
        this.coinText.text = 'Coins: '+ this.coincount


        //movement clamping and countermovement
        const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

        my.sprite.player.body.velocity.x = clamp(my.sprite.player.body.velocity.x, -850, 850)
        my.sprite.player.body.velocity.y = clamp(my.sprite.player.body.velocity.y, -850, 850)

        if(cursors.left.isUp && cursors.right.isUp){
            if(my.sprite.player.body.velocity.x>300){
                my.sprite.player.body.velocity.x -= 5
            }else if(my.sprite.player.body.velocity.x<-300){
                my.sprite.player.body.velocity.x += 5
            }
            
        }
        
        if(this.Rkey.isDown && my.sprite.player.visible == false){
            this.reset_game()
        }

        if(cursors.left.isDown && my.sprite.player.visible == true) {
            // TODO: have the player accelerate to the left
            if(!my.sprite.player.body.blocked.down){
                my.sprite.player.body.setAccelerationX(-this.ACCELERATION/3);
            }else{
                my.sprite.player.body.setAccelerationX(-this.ACCELERATION);
            }
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);



            this.walking_vfx.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            this.walking_vfx.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                this.walking_vfx.start();

            }else{
                this.walking_vfx.stop();

            }

        } else if(cursors.right.isDown && my.sprite.player.visible == true) {
            // TODO: have the player accelerate to the right
            if(!my.sprite.player.body.blocked.down){
                my.sprite.player.body.setAccelerationX(this.ACCELERATION/2);
            }else{
                my.sprite.player.body.setAccelerationX(this.ACCELERATION);
            }            
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);

            this.walking_vfx.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            this.walking_vfx.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                this.walking_vfx.start();

            }else{
                this.walking_vfx.stop();

            }


        } else {
            // TODO: set acceleration to 0 and have DRAG take over
            my.sprite.player.body.setAccelerationX(0);
            my.sprite.player.body.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            this.walking_vfx.stop();    
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
            
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up) && my.sprite.player.visible == true) {
            // TODO: set a Y velocity to have the player "jump" upwards (negative Y direction)
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            if(!this.jumpSFX.isPlaying){
                this.jumpSFX.play()
            }
        }
        
    }

    kill_player(){
        
        my.sprite.player.visible = false;
        this.gameOverText.visible = true;
        console.log("dead")
    }

    kill_player_win(){
        
        my.sprite.player.visible = false;
        this.gameOverText.text = "You win! Press 'R' to restart"
        this.gameOverText.visible = true;
        console.log("dead")
    }

    reset_game(){
        //reset the coins
        for(let i=0; i<this.coins.length; i++){
            this.coins[i].destroy()
        }

        this.coins = this.map.createFromObjects("collectibles", {
            name: "coin",
            key: "tile_map_sheet",
            frame: 151,
        });

        for(let i = 0; i<this.coins.length; i++){
            this.coins[i].x *= 2
            this.coins[i].y *= 2

        }

        this.coinGroup = this.add.group(this.coins);
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);

        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            this.coincount += 1
            obj2.destroy(); // remove coin on overlap
        });
        this.coincount = 0;


        my.sprite.player.x = game.config.width/4;
        my.sprite.player.y = game.config.height/2;
        this.gameOverText.visible = false;
        my.sprite.player.visible = true;

    }
}