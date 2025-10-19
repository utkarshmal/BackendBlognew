const Brevo = require('@getbrevo/brevo');
require("dotenv").config();


const mailSender = async (email, title, body) => {
  try {
    // TransactionalEmailsApi ka ek naya instance banayein
    const apiInstance = new Brevo.TransactionalEmailsApi();
    console.log("Loading Brevo API Key:", process.env.BREVO_API_KEY);

    // === YEH AUTHENTICATION KA BILKUL SAHI TAREEKA HAI ===
    // .setApiKey() method ka istemal karein
    apiInstance.setApiKey(
        Brevo.TransactionalEmailsApiApiKeys.apiKey, 
        process.env.BREVO_API_KEY
    );

    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    // Email ki details set karein
    sendSmtpEmail.subject = title;
    sendSmtpEmail.htmlContent = body;
    sendSmtpEmail.sender = { "name": "Blog App", "email": "yashmalviya476@gmail.com" };
    sendSmtpEmail.to = [{ "email": email }];

    // Email bhejein
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log("✅ Mail Sent Successfully using Brevo API:", data);
    return data;

  } catch (error) {
    console.error("❌ Brevo API Mail Sending Error:", error.message);
    // Behtar error details ke liye
    if (error.response) {
      console.error(error.response.body);
    }
    throw error;
  }
};

module.exports = mailSender;