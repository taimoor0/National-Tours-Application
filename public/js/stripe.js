/* eslint-disable */
import axios from "axios";
import { showAlert } from "./alerts";

// import Stripe from "stripe";  // To solve the "stripe.redirectToCheckout" function first uncomment then comment then it work
const stripe = Stripe(
  "pk_test_51NxljoCEVD0qgVDfMSM3Uj5mXhvtsKZJPRaVH2DQaJUOwpxCg6HNJurjt3ExpTU5gyhmnIOxhN0eZdf3INBXPWjt00amXtyXAr",
);

export const bookTour = async (tourId) => {
  try {
    // 1. Get checkout session from API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`,
    );

    // 2. Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert("error", err);
  }
};
