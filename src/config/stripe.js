// @ts-ignore
const stripe = require("stripe");

// @ts-ignore
const stripeClient = stripe(
  process.env.STRIPE_SECRET_KEY ||
    "sk_test_51RAnCtJITRXES6s8tTBIWEgmliISWJSFlfDN8tL6xNYbrM4GHTTebdF5wXGDCuRAqTUTgFYx4QR2AUn0Jim45cVY00UPZhebzF"
);

module.exports = stripeClient;
