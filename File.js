const dateFormat = require('dateformat');

class File {
  constructor(file, pathToFile, stats) {
    // Stats contains the following properties:
    //   isDirectory: Tells whether this is a file or folder
    //   size: The size of the object in KB
    //   created: The time of creation
    //   modified: The time of last modification
    this.stats = stats;
    this.fileName = file;
    this.filePath = pathToFile;
  }

  formatDates() {
    const createdDate = dateFormat(this.stats.created, 'mm/dd/yyyy hh:MM:ss');
    const modifiedDate = dateFormat(this.stats.modifiedDate, 'mm/dd/yyyy hh:MM:ss');

    return { createdDate, modifiedDate };
  }
}

module.exports.File = File;
