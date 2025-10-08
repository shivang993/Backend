import nodemailer from "nodemailer";
import register from "../controllers/userController.js";


const sendEmail = async ({email,subject,message}) => {
    console.log(process.env.SMTP_MAIL, process.env.SMTP_PASSWORD);
    const transporter=nodemailer.createTransport({
     //   host:process.env.SMTP_HOST,
       // service:process.env.SMTP_SERVICE,
//  port:process.env.SMTP_PORT,
         service: 'gmail',
        auth:{
            user:process.env.SMTP_MAIL,
            pass:process.env.SMTP_PASSWORD,
        },
  tls: {
    rejectUnauthorized: false // <-- allows self-signed certs
  }
    });

    const options={
        from:process.env.SMTP_MAIL,
        to:email,
        subject:subject,
        html:message,
    };

await transporter.sendMail(options);
}
export default sendEmail;