import multer, { diskStorage } from "multer";

const upload = multer({ storage: diskStorage({}) });

export default upload