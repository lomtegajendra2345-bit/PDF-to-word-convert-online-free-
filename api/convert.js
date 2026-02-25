export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable from "formidable";
import fs from "fs";
import axios from "axios";

export default async function handler(req, res) {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    const file = files.file;

    const fileData = fs.readFileSync(file.filepath);

    try {
      const response = await axios.post(
        "https://api.cloudconvert.com/v2/jobs",
        {
          tasks: {
            "import-file": {
              operation: "import/upload"
            },
            "convert-file": {
              operation: "convert",
              input: "import-file",
              output_format: "docx"
            },
            "export-file": {
              operation: "export/url",
              input: "convert-file"
            }
          }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.CLOUDCONVERT_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      res.status(200).json(response.data);
    } catch (error) {
      res.status(500).send("Error converting file");
    }
  });
}
