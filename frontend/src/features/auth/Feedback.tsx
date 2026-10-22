import { ApiError } from '../../api/client';

export function authError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'LOGIN_LOCKED')
      return 'Нэвтрэх оролдлого түр хязгаарлагдлаа. 10 минутын дараа дахин оролдоно уу.';
    if (error.code === 'INVALID_CREDENTIALS') return 'И-мэйл эсвэл нууц үг буруу байна.';
    if (error.code === 'ACCOUNT_UNAVAILABLE')
      return 'И-мэйлээ баталгаажуулсан, идэвхтэй бүртгэлээр нэвтэрнэ үү. Бүртгэл хязгаарлагдсан бол админтай холбогдоно уу.';
  }
  return error instanceof Error ? error.message : 'Алдаа гарлаа. Дахин оролдоно уу.';
}

export function ErrorNotice({ message, requestId }: { message: string; requestId?: string }) {
  if (!message) return null;
  return (
    <div className="notice notice-error" role="alert">
      <p>{message}</p>
      {requestId && <small>Дэмжлэгийн дугаар: {requestId}</small>}
    </div>
  );
}
