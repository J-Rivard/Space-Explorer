/* eslint-disable */
const fs = require('fs');
const fsPlus = require('fs-extended')
const homedir = require('os').homedir();
const path = require('path');

class FileNavigator {
  constructor() {
    // Directory to the 'trash can'
    this.trashDirectory = path.join(homedir, 'TempTrash');
    // this.tempPath = '/Users/jrivard/Documents/Spring_2019/2_Javascript/projectTesting';

    // What the file manager is currently showing
    this.cwd = '';
    this.copiedPath = '';
    this.copiedFileName = '';

    // TODO: Change temppath to homedir in final
    this.cwd = this.updateDirectory('', homedir, true);
    this.moveTo(this.cwd);
  }

  copy(fileName, pathToFile) {
    this.copiedPath = pathToFile;
    this.copiedFileName = fileName;
    console.log('Copied ', this.copiedPath, this.copiedFileName);
  };

  paste() {
    const fileCopyPath = path.join(this.cwd, this.copiedFileName);
    try {
      fs.copyFileSync(this.copiedPath, fileCopyPath, fs.constants.COPYFILE_EXCL);
    } catch(e) {
      console.log(e);
      return undefined;
    }
    console.log('Pasted ', fileCopyPath);
    return { path: fileCopyPath, name: this.copiedFileName };
  };

  move(fileToMove, destination) {
    const fileCopyPath = path.join(destination, fileToMove.fileName);
    try {
      fs.copyFileSync(fileToMove.filePath, fileCopyPath, fs.constants.COPYFILE_EXCL);
      this.rm(fileToMove);
    } catch(e) {
      console.log(e);
      return undefined;
    }
    console.log(`Moved ${fileToMove.fileName} to ${fileCopyPath}`);
    return fileCopyPath;
  }

  rm(file) {
    // This will copy a file before deleting it to a trash folder
    // If the folder doesn't exist, it will create it
    try {
      if (file.stats.isDirectory) {
        fsPlus.copyDirSync(file.filePath, path.join(this.trashDirectory, file.fileName))
      } else {
        fs.copyFileSync(file.filePath, path.join(this.trashDirectory, file.fileName));
      }
    } catch (e) {
      fs.mkdirSync(path.join(homedir, 'TempTrash'));
      fs.copyFileSync(file.filePath, path.join(this.trashDirectory, file.fileName));
    }

    if (file.stats.isDirectory) {
      fsPlus.deleteDir(file.filePath);
    } else {
      fs.unlinkSync(file.filePath);
    }
  };

  mkdir(dirname) {
    const newDirectory = path.join(this.cwd, dirname);
    fs.mkdirSync(newDirectory);
    return newDirectory;
  };

  touch(filename) {
    const newFile = path.join(this.cwd, filename);
    fs.closeSync(fs.openSync(newFile, 'a'));
    return newFile;
  };

  // Returns a stats object containing isDirectory, size
  getStats(directory) {
    const stats = fs.statSync(directory);

    return {
      isDirectory: stats.isDirectory(),
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
    };
  }

  // Takes in the current path, an optional file, and a bool if forward or backward
  // Returns a new path either forward with the optional file or the path to prev dir
  updateDirectory(current, file, forward) {
    if (forward) {
      current = path.join(this.cwd, file);
    } else {
      const data = current.split(path.sep);
      if (data.length > 2) data.pop();
      current = data.join(path.sep);
    }
    return current;
  }

  moveTo(directory) {
    this.currentFiles = fs.readdirSync(directory);
    this.cwd = directory;
    document.title = directory;
  }
}

module.exports.FileNavigator = FileNavigator;
