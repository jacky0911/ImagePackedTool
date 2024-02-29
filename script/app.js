const Jimp = require("jimp");
const config = require("./config");
const fs = require("fs");

//
//
//
// console.log(inputDirectory);
// console.log(outputDirectory);

// console.log(config);

function scanAllImageOnFolder() {
    let inputDirectory = config.imageProcessing.inputDirectory;
    const outputDirectory = config.imageProcessing.outputDirectory;

    if(!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory);
    }

    fs.readdir(inputDirectory, (error, files) => {
        if(error) {
            console.error('Error reading input directory: ', error);
            return;
        }

        const imagesInfo = [];

        files.forEach( file => {
            const inputImagePath = `${inputDirectory}/${file}`;
            const outputImagePath = `${outputDirectory}/${file}`;

            if (file.match(/\.(jpg|jpeg|png)$/)) {
                // Sử dụng thư viện Jimp để đọc thông tin hình ảnh
                Jimp.read(inputImagePath)
                    .then(async image => {
                        const imageInfo = {
                            name: file.replace(/\.(jpg|jpeg|png)$/, ''),
                            anchor: {x: 0, y: 0}, // Thay đổi theo yêu cầu của bạn
                            size: {width: image.bitmap.width, height: image.bitmap.height},
                            scale: 1.0 // Thay đổi theo yêu cầu của bạn
                        };

                        // Lưu thông tin vào mảng
                        imagesInfo.push(imageInfo);


                        // Thực hiện việc scale image theo tỷ lệ tại đây
                        // await scaleAndSaveImage(inputImagePath, outputImagePath, config.imageProcessing.scaleRatio);

                        // Thực hiện việc tính lại anchor của hình ảnh và lưu lại vào trong file json tại đây
                        await cropAndSaveImage(inputImagePath, outputImagePath);

                        // Lưu thông tin của hình ảnh vào tệp JSON
                        const outputJsonPath = `${outputDirectory}/images_info.json`;
                        fs.writeFileSync(outputJsonPath, JSON.stringify(imagesInfo, null, 2));

                        console.log(`Image info for ${file} saved to ${outputJsonPath}`);
                    })
                    .catch(err => {
                        console.error(`Error processing image ${file}:`, err);
                    });
            } else {
                console.log(`File ${file} is not an image. Skipped.`);
            }

        })
    })

    console.log('inputDirectory: ', inputDirectory);
}

async function cropAndAdjustAnchor(inputImagePath, outputImagePath) {
    try {
        // Đọc hình ảnh
        const image = await Jimp.read(inputImagePath);

        console.log('image info: ', image);

        // Tìm toạ độ góc trên bên trái không phải là transparent
        let topLeft = { x: 0, y: 0 };
        for (let y = 0; y < image.bitmap.height; y++) {
            for (let x = 0; x < image.bitmap.width; x++) {
                const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
                if (pixel.a !== 0) {
                    topLeft = { x, y };
                    break;
                }
            }
            if (topLeft.x !== 0 || topLeft.y !== 0) {
                break;
            }
        }

        // Tìm toạ độ góc dưới bên phải không phải là transparent
        let bottomRight = { x: image.bitmap.width - 1, y: image.bitmap.height - 1 };
        for (let y = image.bitmap.height - 1; y >= 0; y--) {
            for (let x = image.bitmap.width - 1; x >= 0; x--) {
                const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
                if (pixel.a !== 0) {
                    bottomRight = { x, y };
                    break;
                }
            }
            if (bottomRight.x !== image.bitmap.width - 1 || bottomRight.y !== image.bitmap.height - 1) {
                break;
            }
        }

        // Cắt hình ảnh dựa trên toạ độ không phải là transparent ở hai góc
        const croppedImage = image.clone().crop(topLeft.x, topLeft.y, bottomRight.x - topLeft.x + 1, bottomRight.y - topLeft.y + 1);

        // Tính lại điểm anchor dựa trên toạ độ không phải là transparent ở góc trên bên trái
        const adjustedAnchor = { x: 0, y: 0 };

        // Lưu hình ảnh cắt và điểm anchor vào tệp mới
        await croppedImage.writeAsync(outputImagePath);
        console.log(`Image cropped and saved to ${outputImagePath}`);
        console.log('Adjusted anchor:', adjustedAnchor);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function scaleAndSaveImage(inputPath, outputPath, scale) {
    try {
        const image = await(Jimp.read(inputPath))
        const newWidth = Math.round(image.getWidth() * scale);
        const newHeight = Math.round(image.getHeight() * scale);

        await image.resize(newWidth, newHeight);

        const boundingBox = findBoundingBox(image);

        console.log(boundingBox);

        // Save the resized image to the output path
        await image.writeAsync(outputPath);

        console.log(`Image scaled and saved to: ${outputPath}`);
    }
    catch (e){
        console.error("Error: ${e.message}")
    }
}

async function cropAndSaveImage(inputPath, outputPath) {
    try {
        // Load the image using Jimp
        const image = await Jimp.read(inputPath);

        const imageClone = image.clone();

        // Find the bounding box based on alpha channel
        // const { top, bottom, left, right } = findBoundingBox(image);
        //
        // // Crop the image based on the bounding box
        // const croppedImage = image.clone().crop(left, top, right - left, bottom - top);

        // Save the cropped image to the output path
        await imageClone.writeAsync(outputPath);

        console.log(`Image cropped and saved to: ${outputPath}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

// Function to find bounding box based on alpha channel
function findBoundingBox(image) {
    const width = image.getWidth();
    const height = image.getHeight();

    let top = height;
    let bottom = 0;
    let left = width;
    let right = 0;

    // Iterate through each pixel to find bounding box
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const alpha = Jimp.intToRGBA(image.getPixelColor(x, y)).a;
            if (alpha > 0) {
                top = Math.min(top, y);
                bottom = Math.max(bottom, y);
                left = Math.min(left, x);
                right = Math.max(right, x);
            }
        }
    }

    return { top, bottom, left, right };
}

scanAllImageOnFolder();

// fs.readdir(inputDirectory =>(err, files) {
// })
