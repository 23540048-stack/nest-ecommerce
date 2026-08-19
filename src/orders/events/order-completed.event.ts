export class OrderCompletedEvent {
  constructor(
    public readonly userId: string, // ID của người mua
    public readonly orderId: string, // ID của đơn hàng
    public readonly amount: number, // Số tiền của đơn hàng đó
  ) {}
}
