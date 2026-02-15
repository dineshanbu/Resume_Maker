const nodemailer = require("nodemailer");

async function sendMail() {

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "donh51561@gmail.com",
    pass: "oehvtlgnlkhtjsth",
  },
});

const portData = Array.from({ length: 50 }, (_, i) => ({
  Id: i + 1,
  Code_Value: `PORT-${i + 1}`
}));

const ampList = portData.map(port => `
  <amp-list width="auto"
    height="40"
    layout="fixed-height">
      <template type="amp-mustache">
        <div style="padding:8px;border-bottom:1px solid #ddd;">
          ${port.Code_Value}
        </div>
      </template>
  </amp-list>
`).join("");

let mailOptions = {

from: "donh51561@gmail.com",
to: "dineshanbu259@gmail.com",
subject: "AMP Dynamic Port List",

// ✅ Fallback
html: `
<h2>Port List</h2>
<p>Your email client does not support AMP.</p>
<p>Total Records: ${portData.length}</p>
`,

// ⭐ AMP VERSION
amp: `
<!doctype html>
<html ⚡4email>
<head>
<meta charset="utf-8">

<script async src="https://cdn.ampproject.org/v0.js"></script>

<script async custom-element="amp-list"
src="https://cdn.ampproject.org/v0/amp-list-0.1.js"></script>

<script async custom-template="amp-mustache"
src="https://cdn.ampproject.org/v0/amp-mustache-0.2.js"></script>

<style amp4email-boilerplate>
body{visibility:hidden}
</style>

<style amp-custom>
.card{
 padding:16px;
 border:1px solid #ddd;
 border-radius:8px;
}
</style>
</head>

<body>

<h2>🚢 Port Operations</h2>

<div class="card">

<amp-list width="auto"
 height="120"
 layout="fixed-height">

<template type="amp-mustache">

<div>PORT-1</div>
<div>PORT-2</div>
<div>PORT-3</div>

</template>

</amp-list>

</div>

</body>
</html>

`,

text: "Port Operations List"

};

await transporter.sendMail(mailOptions);

console.log("✅ AMP Email Sent");
}

sendMail();
