export const config = {
  api: { bodyParser: false },
};

import formidable from "formidable";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";

export default async function handler(req, res) {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    try {
      const file = files.file;

      // ✅ 1. Create CloudConvert Job
      const job = await axios.post(
        "https://api.cloudconvert.com/v2/jobs",
        {
          tasks: {
            "import-file": { operation: "import/upload" },
            "convert-file": {
              operation: "convert",
              input: "import-file",
              output_format: "docx",
            },
            "export-file": {
              operation: "export/url",
              input: "convert-file",
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.CLOUDCONVERT_API_KEY}`,
          },
        }
      );

      const uploadTask = job.data.data.tasks.find(
        (t) => t.name === "import-file"
      );

      // ✅ 2. Upload file to CloudConvert
      const formData = new FormData();

      Object.entries(uploadTask.result.form.parameters).forEach(([key, value]) => {
        formData.append(key, value);
      });

      formData.append(
        "file",
        fs.createReadStream(file.filepath)
      );

      await axios.post(uploadTask.result.form.url, formData, {
        headers: formData.getHeaders(),
      });

      // ✅ 3. Wait & get result
      const jobId = job.data.data.id;

      let completedJob;

      while (true) {
        const jobStatus = await axios.get(
          `https://api.cloudconvert.com/v2/jobs/${jobId}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.CLOUDCONVERT_API_KEY}`,
            },
          }
        );

        completedJob = jobStatus.data.data;

        if (completedJob.status === "finished") break;
        if (completedJob.status === "error") throw new Error("Conversion failed");

        await new Promise((r) => setTimeout(r, 2000));
      }

      const exportTask = completedJob.tasks.find(
        (t) => t.name === "export-file"
      );

      const fileUrl = exportTask.result.files[0].url;

      res.status(200).json({ url: fileUrl });

    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Conversion failed" });
    }
  });
    }
