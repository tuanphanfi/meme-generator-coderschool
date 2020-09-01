const fs = require("fs");
const utilsHelper = require("../helpers/utils.helper");
const photoHelper = require("../helpers/photo.helper");

const memeController = {};

memeController.createMeme = async (req, res, next) => {
  try {
    // Read data from the json file
    let rawData = fs.readFileSync("memes.json");
    let memes = JSON.parse(rawData).memes;
    const { texts } = req.body;
    const meme = {};
    // Prepare data for the new meme
    meme.id = utilsHelper.generateRandomHexString(15);
    meme.originalImage = req.file.filename;
    meme.originalImagePath = req.file.path;
    meme.outputMemePath = `${req.file.destination}MEME_${
      meme.id
      }.${meme.originalImage.split(".").pop()}`;
    console.log(texts);
    meme.texts =
      texts && texts.length ? texts.map((text) => JSON.parse(text)) : [];
    // Put text on image
    await photoHelper.putTextOnImage(
      meme.originalImagePath,
      meme.outputMemePath,
      meme.texts
    );
    // Add the new meme to the beginning of the list and save to the json file
    meme.createdAt = Date.now();
    meme.updatedAt = Date.now();
    memes.unshift(meme);
    fs.writeFileSync("memes.json", JSON.stringify({ memes }));
    return utilsHelper.sendResponse(
      res,
      200,
      true,
      meme,
      null,
      "The new meme has been created!"
    );
  } catch (err) {
    next(err);
  }
};

memeController.getOriginalImages = (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const perPage = req.query.perPage || 10;

    // Read data from the json file
    let rawData = fs.readFileSync("memes.json");
    let memes = JSON.parse(rawData).memes;
    let originalImages = memes.map((item) => item.originalImagePath);
    originalImages = originalImages.filter(
      (item, i, arr) => arr.indexOf(item) === i
    );
    // Calculate slicing
    const totalMemes = memes.length;
    const totalPages = Math.ceil(totalMemes / perPage);
    const offset = perPage * (page - 1);
    originalImages = originalImages.slice(offset, offset + perPage);

    return utilsHelper.sendResponse(
      res,
      200,
      true,
      { originalImages, totalPages },
      null,
      "Get original images successful"
    );
  } catch (err) {
    next(err);
  }
};

memeController.updateMeme = async (req, res, next) => {
  try {
    const memeId = req.params.id;
    // Read data from the json file
    let rawData = fs.readFileSync("memes.json");
    let memes = JSON.parse(rawData).memes;
    const index = memes.findIndex((meme) => meme.id === memeId);
    if (index === -1) {
      return utilsHelper.sendResponse(
        res,
        400,
        false,
        null,
        new Error("Meme not found"),
        null
      );
    }
    const meme = memes[index];
    let { texts } = req.body;
    if (!Array.isArray(texts)) texts = [texts];
    meme.texts = texts || [];
    meme.updatedAt = Date.now();

    // Put text on image
    await photoHelper.putTextOnImage(
      meme.originalImagePath,
      meme.outputMemePath,
      meme.texts
    );
    fs.writeFileSync("memes.json", JSON.stringify({ memes }));
    return utilsHelper.sendResponse(
      res,
      200,
      true,
      meme,
      null,
      "Meme has been updated!"
    );
  } catch (err) {
    next(err);
  }
};


module.exports = memeController;
