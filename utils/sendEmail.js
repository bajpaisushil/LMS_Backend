import nodemailer from 'nodemailer';

const sendEmail = (req, res, emailData) => {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: `${process.env.EMAIL_FROM}`, // MAKE SURE THIS EMAIL IS YOUR GMAIL FOR WHICH YOU GENERATED APP PASSWORD
        pass: `${process.env.APP_PASS}`, // MAKE SURE THIS PASSWORD IS YOUR GMAIL APP PASSWORD WHICH YOU GENERATED EARLIER
      },
      tls: {
        ciphers: "SSLv3",
      },
    });
  
    const info= transporter
      .sendMail(emailData)
      .then((info) => {
        console.log(`Message sent: ${info.response}`);
        return res.json({
          message: `Email has been sent to ${emailData.to}. Follow the instruction to activate your account`,
        });
      })
      .catch((err) => console.log(`Problem sending email: ${err}`));
      return info;
  };

export default sendEmail;
