const { reviewArticleTemplate } = require("../emailTemplates/reviewArticleTemplate");
const { sendMail } = require("../services/emailServices");
const RESTRESPONSE = require("../utils/RESTRESPONSE");

const sendReviewArticleEmailToClient = async (req, res) => {
  const { toMail, fromMail, articles, clientName } = req.body;

  if (!toMail)
    return res.status(400).send(RESTRESPONSE(false, "toMail is required"));
  if (!articles)
    return res.status(400).send(RESTRESPONSE(false, "articles are required"));
  if (!clientName)
    return res.status(400).send(RESTRESPONSE(false, "clientName is required"));
  if (articles.length === 0)
    return res
      .status(400)
      .send(RESTRESPONSE(false, "articles cannot be empty"));

  const subject = "Articles assigned for review";
  const body = reviewArticleTemplate(clientName, articles);

  // Logic to send email
  try {
    let emailResponse = await sendMail({ toMail, fromMail, subject, body });
    res.send(RESTRESPONSE(true, "Email Sent Successfully", { emailResponse }));
  } catch (error) {
    res.status(500).send(RESTRESPONSE(false, err.message));
  }
};

module.exports = { sendReviewArticleEmailToClient };
