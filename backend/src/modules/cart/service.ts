import { AppError } from "../../utils/app-error.js";
import { cartRepository, type CartRecord, type CartRepository } from "./repository.js";
import type {
  AddCartItemRequestDTO,
  CartResponseDTO,
  ClearCartResponseDTO,
  UpdateCartItemRequestDTO,
} from "./types.js";

const toCartResponse = (cart: CartRecord): CartResponseDTO => ({
  id: cart.id,
  userId: cart.userId,
  restaurantId: cart.restaurantId,
  subtotal: cart.subtotal.toNumber(),
  totalAmount: cart.totalAmount.toNumber(),
  isActive: cart.isActive,
  items: cart.items.map((item) => ({
    id: item.id,
    menuItemId: item.menuItemId,
    quantity: item.quantity,
    unitPrice: item.unitPrice.toNumber(),
    subtotal: item.subtotal.toNumber(),
    menuItem: item.menuItem,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  })),
  createdAt: cart.createdAt.toISOString(),
  updatedAt: cart.updatedAt.toISOString(),
});

export class CartService {
  public constructor(private readonly repository: CartRepository) {}

  public async get(userId: string): Promise<CartResponseDTO> {
    const cart = await this.repository.getOrCreateActive(userId);
    return toCartResponse(cart);
  }

  public async addItem(userId: string, input: AddCartItemRequestDTO): Promise<CartResponseDTO> {
    const menuItem = await this.repository.findAvailableMenuItem(input.menuItemId);

    if (menuItem === null) {
      throw new AppError("Menu item not found or unavailable", 404);
    }

    const cart = await this.repository.getOrCreateActive(userId);

    if (cart.restaurantId !== null && cart.restaurantId !== menuItem.restaurantId) {
      throw new AppError("Cart can contain items from only one restaurant", 400);
    }

    const updatedCart = await this.repository.addItem(cart.id, menuItem, input.quantity);
    return toCartResponse(updatedCart);
  }

  public async updateItem(
    userId: string,
    itemId: string,
    input: UpdateCartItemRequestDTO,
  ): Promise<CartResponseDTO> {
    const cart = await this.repository.updateItemQuantity(userId, itemId, input.quantity);

    if (cart === null) {
      throw new AppError("Cart item not found", 404);
    }

    return toCartResponse(cart);
  }

  public async removeItem(userId: string, itemId: string): Promise<CartResponseDTO> {
    const cart = await this.repository.removeItem(userId, itemId);

    if (cart === null) {
      throw new AppError("Cart item not found", 404);
    }

    return toCartResponse(cart);
  }

  public async clear(userId: string): Promise<ClearCartResponseDTO> {
    await this.repository.clear(userId);
    return { cleared: true };
  }
}

export const cartService = new CartService(cartRepository);
