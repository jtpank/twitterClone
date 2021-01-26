//storing images in mongodb
//npm install express multer multer-gridfs-storage
const util = require("util")
const multer = require("multer")
const GridFsStorage = require("multer-gridfs-storage")

let storage = new GridFsStorage({
    url: process.env.CONNECTIONSTRING,
    options: {newUrlParser: true, useUnifiedTopology: true},
    file: (req, file) => {
        const match = ["image/png", "image/jpg", "image/jpeg"]
        if(match.indexOf(file.mimetype) == -1){
            const filename = `${Date.now()}-jpclone-${file.originalname}`
            return filename
        }
        return {
            bucketName: "photos",
            filename: `${Date.now()}-jpclone-${file.originalname}`
        }
    }
})
let uploadFile = multer({storage: storage}).single("file")
let uploadFilesMiddleware = util.promisify(uploadFile)
module.exports = uploadFilesMiddleware