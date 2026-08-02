export interface IEmailSender {
  send(to: string, subject: string, body: string): Promise<void>;
}
