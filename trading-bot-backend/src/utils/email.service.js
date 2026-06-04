const nodemailer = require('nodemailer');

const createTransporter = async () => {
  // For development, use Ethereal Email
  let testAccount = await nodemailer.createTestAccount();

  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });
};

const sendInvoiceEmail = async (to, invoiceBuffer, invoiceNumber) => {
  try {
    const transporter = await createTransporter();
    
    const info = await transporter.sendMail({
      from: '"TradeMind ERP" <billing@trademind.com>',
      to: to,
      subject: `Your Invoice ${invoiceNumber}`,
      text: `Please find attached the invoice ${invoiceNumber} for your recent order.`,
      html: `<p>Dear Client,</p><p>Please find attached the invoice <b>${invoiceNumber}</b> for your recent order.</p><p>Thank you for your business!</p>`,
      attachments: [
        {
          filename: `Invoice_${invoiceNumber}.pdf`,
          content: invoiceBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    
    return { success: true, previewUrl: nodemailer.getTestMessageUrl(info) };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendInvoiceEmail };
