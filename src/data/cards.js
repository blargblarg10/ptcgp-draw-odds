/**
 * Card definitions for the PTCGP Draw Odds Calculator
 * Each card has properties:
 * - name: Name of the card
 * - effect: Text description of what the card does
 * - calculationParams: Parameters needed for odds calculation
 *   - affects: Specifies whether the card affects "user" or "opponent"
 */

class Card {
  constructor(name, effect, calculationParams) {
    this.name = name;
    this.effect = effect;
    this.calculationParams = calculationParams;
  }
  
  // Helper method to get who the card affects
  get affects() {
    return this.calculationParams.affects || 'user';
  }
}

// Card collection
const cards = {  'Iono': new Card(
    'Iono',
    'Trainer - Supporter: Each player shuffles the cards in their hand into their deck, then draws that many cards.',
    {
      type: 'shuffle_and_draw_same',
      // Threshold for considering "worth playing"
      threshold: 0.5,
      points: false,
      affects: 'user' // Even though it affects both players, treating as user-focused per note
    }
  ),
  
  'Mars': new Card(
    'Mars',
    'Trainer - Supporter: Your opponent shuffles their hand into their deck and draws a card for each of their remaining points needed to win.',
    {
      type: 'opponent_shuffle_draw_by_points',
      // Higher threshold when cards are already in hand
      thresholdWithCardsInHand: 0.7,
      thresholdWithoutCardsInHand: 0.5,
      points: true,
      affects: 'opponent'
    }
  ),
  
  'Red Card': new Card(
    'Red Card',
    'Trainer - Item: Your opponent shuffles their hand into their deck and draws 3 cards.',
    {
      type: 'opponent_shuffle_and_draw',
      drawCount: 3,
      // Red Card is generally worth playing for disruption
      alwaysWorthIt: true,
      points: false,
      affects: 'opponent'
    }
  )
};

// Get list of available card names
const getAvailableCards = () => Object.keys(cards);

// Get a specific card by name
const getCard = (name) => cards[name];

export { getAvailableCards, getCard };
