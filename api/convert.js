export default async function handler(req, res) {

const apiKey = process.env.CLOUDCONVERT_API_KEY;

const response = await fetch("https://api.cloudconvert.com/v2/jobs", {
method: "POST",
headers: {
"Authorization": "Bearer " + apiKey,
"Content-Type": "application/json"
},
body: JSON.stringify({
tasks: {
"import-my-file": { operation: "import/upload" },
"convert-my-file": {
operation: "convert",
input: "import-my-file",
output_format: "docx"
},
"export-my-file": {
operation: "export/url",
input: "convert-my-file"
}
}
})
});

const data = await response.json();

res.status(200).json(data);

}
