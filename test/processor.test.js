var Ffmpeg = require('../lib'),
  path = require('path'),
  fs = require('fs'),
  assert = require('assert'),
  exec = require('child_process').exec;

describe('Processor', function() {
  before(function(done) {
    // check for ffmpeg installation
    this.testfile = __dirname + '/assets/testvideo-43.avi';
    this.testfilewide = __dirname + '/assets/testvideo-169.avi';
    
    var self = this;
    exec('which ffmpeg', function(err, stdout, stderr) {
      if (stdout !== '') {
        // check if file exists
        path.exists(self.testfile, function(exists) {
          if (exists) {
            done();
          } else {
            done(new Error('test video file does not exist, check path (' + self.testfile + ')'));
          }
        });
      } else {
        done(new Error('cannot run test without ffmpeg installed, aborting test...'));
      }
    });
  });

  it('should kill the process on timeout', function(done) {
    var testFile = __dirname + '/assets/testProcessKill.flv';
    new Ffmpeg({ source: this.testfile, nolog: true, timeout: 0.02 })
        .usingPreset('flashvideo')
        .renice(19)
        .saveToFile(testFile, function(code, err) {
          code.should.equal(-99);
          path.exists(testFile, function(exist) {
            if (exist) {
              fs.unlinkSync(testFile);
            }
            done();
          });
        });
  });

  it('should report codec data through event onCodecData', function(done) {
    var testFile = __dirname + '/assets/testOnCodecData.flv';
    new Ffmpeg({ source: this.testfile, nolog: true })
        .onCodecData(function(data) {
          data.should.have.property('audio');
          data.should.have.property('video');
        })
        .usingPreset('flashvideo')
        .renice(19)
        .saveToFile(testFile, function(code, err) {
          path.exists(testFile, function(exist) {
            if (exist) {
              fs.unlinkSync(testFile);
            }
            done();
          });
        });
  });

  it('should report progress through event onProgress', function(done) {
    var testFile = __dirname + '/assets/testOnProgress.flv';
    new Ffmpeg({ source: this.testfile, nolog: true })
        .onProgress(function(data) {
          // conversion is too fast to make any progress reporting on the test assets,
          // but it's idiotic to commit a 5M+ file to github just for 1 test.
          // I'll leave this test here for coverage's sake...
        })
        .usingPreset('flashvideo')
        .renice(19)
        .saveToFile(testFile, function(code, err) {
          path.exists(testFile, function(exist) {
            if (exist) {
              fs.unlinkSync(testFile);
            }
            done();
          });
        });
  });

  it('should properly take a certain amount of screenshots at defined timemarks', function(done) {
    var testFolder = __dirname + '/assets/tntest_config';
    var args = new Ffmpeg({ source: this.testfile, nolog: true })
      .withSize('150x?')
      .renice(19)
      .takeScreenshots({
        count: 2,
        timemarks: [ '0.5', '1' ]
      }, testFolder, function(err) {
        assert.ok(!err);
        fs.readdir(testFolder, function(err, files) {
          var tnCount = 0;
          files.forEach(function(file) {
            if (file.indexOf('.jpg') > -1) {
              tnCount++;
              fs.unlinkSync(testFolder + '/' + file);
            }
          });
          tnCount.should.equal(2);
          // remove folder
          fs.rmdirSync(testFolder);
          done();
        });
      });
  });

  describe('saveToFile', function() {
    it('should save the output file properly to disk', function(done) {
      var testFile = __dirname + '/assets/testConvertToFile.flv';
      new Ffmpeg({ source: this.testfile, nolog: true })
        .usingPreset('flashvideo')
        .renice(19)
        .saveToFile(testFile, function(stdout, stderr, err) {
          assert.ok(!err);
          path.exists(testFile, function(exist) {
            exist.should.true;
            // check filesize to make sure conversion actually worked
            fs.stat(testFile, function(err, stats) {
              assert.ok(!err && stats);
              stats.size.should.above(0);
              stats.isFile().should.true;
              // unlink file
              fs.unlinkSync(testFile);
              done();
            });
          });
        });
    });
    it('should accept a stream as its source', function(done) {
      var testFile = __dirname + '/assets/testConvertFromStreamToFile.flv';
      var instream = fs.createReadStream(this.testfile);
      new Ffmpeg({ source: instream, nolog: true })
        .usingPreset('flashvideo')
        .renice(19)
        .saveToFile(testFile, function(stdout, stderr, err) {
          assert.ok(!err);
          path.exists(testFile, function(exist) {
            exist.should.true;
            // check filesize to make sure conversion actually worked
            fs.stat(testFile, function(err, stats) {
              assert.ok(!err && stats);
              stats.size.should.above(0);
              stats.isFile().should.true;
              // unlink file
              fs.unlinkSync(testFile);
              done();
            });
          });
        });
    });
  });

  describe('writeToStream', function() {
    it('should save the output file properly to disk using a stream', function(done) {
      var testFile = __dirname + '/assets/testConvertToStream.flv';
      var outstream = fs.createWriteStream(testFile);
      new Ffmpeg({ source: this.testfile, nolog: true })
        .usingPreset('flashvideo')
        .renice(19)
        .writeToStream(outstream, function(code, stderr) {
          path.exists(testFile, function(exist) {
            exist.should.true;
            // check filesize to make sure conversion actually worked
            fs.stat(testFile, function(err, stats) {
              assert.ok(!err && stats);
              stats.size.should.above(0);
              stats.isFile().should.true;
              // unlink file
              fs.unlinkSync(testFile);
              done();
            });
          });
        });
    });
    it('should accept a stream as its source', function(done) {
      var testFile = __dirname + '/assets/testConvertFromStreamToStream.flv';
      var instream = fs.createReadStream(this.testfile);
      var outstream = fs.createWriteStream(testFile);
      new Ffmpeg({ source: instream, nolog: true })
        .usingPreset('flashvideo')
        .renice(19)
        .writeToStream(outstream, function(code, stderr) {
          path.exists(testFile, function(exist) {
            exist.should.true;
            // check filesize to make sure conversion actually worked
            fs.stat(testFile, function(err, stats) {
              assert.ok(!err && stats);
              stats.size.should.above(0);
              stats.isFile().should.true;
              // unlink file
              fs.unlinkSync(testFile);
              done();
            });
          });
        });
    });
  });
});