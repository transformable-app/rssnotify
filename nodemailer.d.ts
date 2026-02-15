declare module 'nodemailer' {
  interface TransportOptions {
    [key: string]: unknown
  }
  interface Transporter {
    sendMail(options: unknown): Promise<unknown>
  }
  interface Nodemailer {
    createTransport(options?: string | TransportOptions): Transporter
  }
  const nodemailer: Nodemailer
  export default nodemailer
}
