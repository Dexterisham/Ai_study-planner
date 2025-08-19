
export enum AppState {
  IDLE,
  PROCESSING,
  CHATTING
}

export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}