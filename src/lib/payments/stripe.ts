import Stripe from "stripe";
import { required } from "../config";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) client = new Stripe(required("STRIPE_SECRET_KEY"));
  return client;
}
