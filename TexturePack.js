const path = require('path');

class TexturePack {
  constructor(theme) {
    this.theme = theme;

    switch (theme) {
      case 'space':
        this.fileTexture = join('textures/space/neptune.jpg');
        this.folderTexture = join('textures/space/mercury.jpg');
        this.backTexture = join('textures/space/sun.jpg');
        this.backgroundTexture = join('textures/space/milkyStars.jpg');
        break;
      case 'balls':
        this.fileTexture = join('textures/balls/basketball.jpg');
        this.folderTexture = join('textures/balls/tennisball.jpg');
        this.backTexture = join('textures/balls/softball.jpg');
        this.backgroundTexture = join('textures/balls/background.jpg');
        break;
      case 'pool':
        this.fileTexture = join('textures/pool/1ball.jpg');
        this.folderTexture = join('textures/pool/15ball.jpg');
        this.backTexture = join('textures/pool/8ball.jpg');
        this.backgroundTexture = join('textures/pool/table.jpg');
        break;
      case 'faces':
        this.fileTexture = join('textures/faces/me.jpg');
        this.folderTexture = join('textures/faces/me.jpg');
        this.backTexture = join('textures/faces/me.jpg');
        this.backgroundTexture = join('textures/space/milkyStars.jpg');
        break;
      default:
        this.theme = theme;
    }
  }

  changeTo(theme) {
    this.theme = theme;

    switch (theme) {
      case 'space':
        this.fileTexture = join('textures/space/neptune.jpg');
        this.folderTexture = join('textures/space/mercury.jpg');
        this.backTexture = join('textures/space/sun.jpg');
        this.backgroundTexture = join('textures/space/milkyStars.jpg');
        break;
      case 'balls':
        this.fileTexture = join('textures/balls/basketball.jpg');
        this.folderTexture = join('textures/balls/tennisball.jpg');
        this.backTexture = join('textures/balls/softball.jpg');
        this.backgroundTexture = join('textures/balls/background.jpg');
        break;
      case 'pool':
        this.fileTexture = join('textures/pool/1ball.jpg');
        this.folderTexture = join('textures/pool/15ball.jpg');
        this.backTexture = join('textures/pool/8ball.jpg');
        this.backgroundTexture = join('textures/pool/table.jpg');
        break;
      case 'faces':
        this.fileTexture = join('textures/faces/dog.jpeg');
        this.folderTexture = join('textures/faces/face2.jpg');
        this.backTexture = join('textures/faces/face.jpeg');
        this.backgroundTexture = join('textures/space/milkyStars.jpg');
        break;
      default:
        this.theme = theme;
    }
  }
}

function join(pathToJoin) {
  return path.join('', pathToJoin);
}

module.exports.TexturePack = TexturePack;
