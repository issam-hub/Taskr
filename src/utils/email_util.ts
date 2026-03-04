import { cwd, loadEnvFile } from "process";
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import nodemailer from "nodemailer";

export const sendMail = async (to: string, subject: string, html: string) => {
  try {
    loadEnvFile();
    const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM } =
      process.env;

    const transporter = nodemailer.createTransport({
      host: MAIL_HOST as string,
      port: MAIL_PORT as unknown as number,
      auth: {
        user: MAIL_USER,
        pass: MAIL_PASS,
      },
    } as nodemailer.TransportOptions);

    const mailOptions = {
      from: MAIL_FROM,
      to,
      subject,
      html,
    };

    const status = await transporter.sendMail(mailOptions);
    if (status.messageId) {
      return status.messageId;
    } else {
      return false;
    }
  } catch (error: any) {
    console.error("error while sending email: ", error.message);
    return false;
  }
};

export function renderTemplate<T extends object>(
  templateName: string,
  data: T,
): string {
  const templatePath = path.join(cwd(), "src/templates", `${templateName}.hbs`);
  const source = fs.readFileSync(templatePath, "utf-8");
  const compiled = Handlebars.compile(source);
  return compiled(data);
}
