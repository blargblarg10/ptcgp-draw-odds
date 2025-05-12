/**
 * Calculation utilities for PTCGP Draw Odds Calculator
 */

// Helper function for calculating combinations (n choose k)
const combination = (n, k) => {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  
  // Calculate using factorials
  return factorial(n) / (factorial(k) * factorial(n - k));
};

// Helper function for calculating factorial
const factorial = (n) => {
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
};

/**
 * Hypergeometric probability function 
 * Calculates probability of drawing at least minSuccesses out of successes
 * 
 * @param {number} population - Total population size (cards in deck)
 * @param {number} successes - Number of success cases in population (specific card in deck)
 * @param {number} sampleSize - Sample size (cards drawn)
 * @param {number} minSuccesses - Minimum number of successes needed
 * @returns {number} - Probability (0-1)
 */
const hypergeometricProbability = (population, successes, sampleSize, minSuccesses) => {
  // Input validation
  if (sampleSize > population) return 0;
  if (successes > population) return 0;
  if (minSuccesses > successes) return 0;
  if (minSuccesses > sampleSize) return 0;
  
  // Calculate the probability of at least minSuccesses
  let probability = 0;
  
  // Sum the probabilities of drawing exactly i successes, 
  // for i from minSuccesses to min(successes, sampleSize)
  for (let i = minSuccesses; i <= Math.min(successes, sampleSize); i++) {
    // Calculate combinations: C(successes, i) * C(population - successes, sampleSize - i) / C(population, sampleSize)
    const numerator = combination(successes, i) * combination(population - successes, sampleSize - i);
    const denominator = combination(population, sampleSize);
    probability += numerator / denominator;
  }
  
  return probability;
};

/**
 * Calculate odds for Iono card
 * 
 * @param {Object} params - Calculation parameters
 * @param {number} params.cardsInDeck - Number of cards in deck
 * @param {number} params.cardsInHand - Number of cards in hand
 * @param {Array} params.remainingInDeck - Array of remaining cards in deck for each unique card
 * @param {Array} params.inHand - Array of cards already in hand for each unique card
 * @returns {Object} - Result object with calculation details
 */
const calculateIonoOdds = (params) => {
  const { cardsInDeck, cardsInHand, remainingInDeck, inHand } = params;
  const card = { 
    name: 'Iono', 
    effect: 'Trainer - Supporter: Each player shuffles the cards in their hand into their deck, then draws that many cards.' 
  };
  
  // Iono makes each player shuffle their hand into their deck and draw that many cards
  const cardsToDraw = cardsInHand;
  
  if (cardsToDraw === 0) {
    return {
      worthIt: false,
      explanation: 'You have no cards in hand, so Iono would have no effect.',
      details: {
        cardName: card.name,
        cardEffect: card.effect,
        currentHandSize: cardsInHand,
        cardsToDraw: cardsToDraw,
        cardsInDeck: cardsInDeck,
        odds: []
      }
    };
  }

  // Calculate odds for each needed card and combine them
  let combinedOdds = 1;
  let allCardsFound = true;
  const cardOdds = [];
  
  for (let i = 0; i < remainingInDeck.length; i++) {
    // Skip if already have the card in hand
    if (inHand[i] > 0) {
      cardOdds.push({
        cardIndex: i + 1,
        inHand: inHand[i],
        remainingInDeck: remainingInDeck[i],
        odds: 100, // 100% because it's already in hand
        comment: 'Already in hand'
      });
      continue;
    }
    
    // Calculate hypergeometric probability of drawing at least one of the card
    const odds = hypergeometricProbability(
      cardsInDeck,
      remainingInDeck[i],
      cardsToDraw,
      1
    );
    
    cardOdds.push({
      cardIndex: i + 1,
      inHand: inHand[i],
      remainingInDeck: remainingInDeck[i],
      odds: (odds * 100).toFixed(2),
      comment: odds < 0.5 ? 'Less than 50% chance' : 'Good chance'
    });
    
    combinedOdds *= odds;
    if (odds < 0.5) allCardsFound = false;
  }
    const worthIt = combinedOdds > 0.5 || allCardsFound;
  let explanation = `Playing Iono will shuffle your hand of ${cardsInHand} cards into your deck and draw ${cardsToDraw} new cards. `;
  explanation += `Chance of getting needed card(s): ${(combinedOdds * 100).toFixed(2)}%. `;
  explanation += worthIt ? 'Worth playing!' : 'Probably not worth playing.';
  
  return {
    worthIt,
    explanation,
    details: {
      cardName: card.name,
      cardEffect: card.effect,
      currentHandSize: cardsInHand,
      cardsToDraw: cardsToDraw,
      cardsInDeck: cardsInDeck,
      combinedOdds: (combinedOdds * 100).toFixed(2),
      odds: cardOdds
    }
  };
};

/**
 * Calculate odds for Mars card
 * 
 * @param {Object} params - Calculation parameters
 * @param {number} params.cardsInDeck - Number of cards in deck
 * @param {number} params.cardsInHand - Number of cards in hand
 * @param {Array} params.remainingInDeck - Array of remaining cards in deck for each unique card
 * @param {Array} params.inHand - Array of cards already in hand for each unique card
 * @param {number} params.opponentPoints - Number of opponent's points (0-2)
 * @returns {Object} - Result object with calculation details
 */
const calculateMarsOdds = (params) => {
  const { cardsInDeck, cardsInHand, remainingInDeck, inHand, opponentPoints } = params;
  const card = { 
    name: 'Mars', 
    effect: 'Trainer - Supporter: Your opponent shuffles their hand into their deck and draws a card for each of their remaining points needed to win.' 
  };
  
  // Mars now lets opponent draw cards based on their remaining points
  // Remaining points = (3 - points already earned)
  const pointsNeeded = 3 - opponentPoints;
  const marsDraw = pointsNeeded;
  
  if (marsDraw <= 0) {
    return {
      worthIt: false,
      explanation: 'Opponent has no points left to earn. Mars would have no effect.',
      details: {
        cardName: card.name,
        cardEffect: card.effect,
        opponentPoints: opponentPoints,
        pointsNeeded: 0,
        recommendation: 'Not worth playing in this situation.'
      }
    };
  }
  
  // Calculate odds for each needed card and combine them
  let marsOdds = 1;
  let anyCardsInHand = false;
  const cardOdds = [];
  
  // Check if any needed cards are already in hand
  for (let i = 0; i < remainingInDeck.length; i++) {
    if (inHand[i] > 0) anyCardsInHand = true;
  }
  
  for (let i = 0; i < remainingInDeck.length; i++) {
    const odds = hypergeometricProbability(
      cardsInDeck,
      remainingInDeck[i],
      marsDraw,
      1
    );
    
    cardOdds.push({
      cardIndex: i + 1,
      inHand: inHand[i],
      remainingInDeck: remainingInDeck[i],
      odds: (odds * 100).toFixed(2),
      willDiscard: inHand[i] > 0,
      comment: inHand[i] > 0 ? 'Will discard from hand!' : 
               (odds < 0.5 ? 'Less than 50% chance' : 'Good chance')
    });
    
    marsOdds *= odds;
  }
  // If we already have needed cards in hand, be more conservative
  const worthIt = marsOdds > (anyCardsInHand ? 0.7 : 0.5);
  let explanation = `Playing Mars will make your opponent shuffle their hand and draw ${marsDraw} new cards based on their remaining points needed to win (${pointsNeeded}). `;
  
  if (anyCardsInHand) {
    explanation += 'Warning: Your opponent will be drawing cards which might help them. ';
  }
  
  explanation += `Chance of them getting needed cards: ${(marsOdds * 100).toFixed(2)}%. `;
  explanation += worthIt ? 'Worth playing as a disruption!' : 'Probably not worth playing.';
  
  return {
    worthIt,
    explanation,
    details: {
      cardName: card.name,
      cardEffect: card.effect,
      opponentPoints: opponentPoints,
      pointsNeeded: pointsNeeded,
      cardsToDraw: marsDraw,
      cardsInDeck: cardsInDeck,
      hasCardsInHand: anyCardsInHand,
      combinedOdds: (marsOdds * 100).toFixed(2),
      thresholdUsed: anyCardsInHand ? '70%' : '50%',
      odds: cardOdds
    }
  };
};

/**
 * Calculate result for Red Card
 * 
 * @returns {Object} - Result object with details
 */
const calculateRedCardResult = () => {
  const card = { 
    name: 'Red Card', 
    effect: 'Trainer - Item: Your opponent shuffles their hand into their deck and draws 3 cards.' 
  };
    // Red Card makes opponent shuffle their hand and draw 3
  // Simplified - always good to disrupt opponent
  return {
    worthIt: true,
    explanation: 'Red Card disrupts your opponent\'s hand by making them shuffle their hand into their deck and draw 3 new cards, generally worth playing if it fits your strategy.',
    details: {
      cardName: card.name,
      cardEffect: card.effect,
      strategicValue: 'High',
      drawCount: 3,
      disruptionPotential: 'Forces opponent to shuffle their hand and draw 3 new cards',
      recommendation: 'Consider the game state - best played when opponent has a large or valuable hand'
    }
  };
};

/**
 * Main calculation function
 * 
 * @param {Object} params - Input parameters
 * @param {string} params.cardName - Selected card name
 * @param {string} params.cardUser - Who the card affects ("user" or "opponent") 
 * @param {number} params.cardsInDeck - Number of cards in deck
 * @param {number} params.cardsInHand - Number of cards in hand 
 * @param {Array} params.remainingInDeck - Array of remaining cards in deck for each unique card
 * @param {Array} params.inHand - Array of cards already in hand for each unique card
 * @param {number} params.opponentPoints - Number of opponent's points (0-2)
 * @param {number} params.userPoints - Number of user's points (0-2)
 * @returns {Object} - Result object with calculation
 */
const calculateOdds = (params) => {
  const { cardName, cardsInDeck, cardsInHand, cardUser, opponentPoints = 1, userPoints = 1 } = params;
  
  // Basic validations
  const totalCardsAccounted = cardsInHand + cardsInDeck;
  if (totalCardsAccounted <= 0) {
    return {
      worthIt: false,
      explanation: 'Invalid deck/hand configuration.',
      details: null
    };
  }
  
  // Different calculations based on the card
  switch(cardName) {
    case 'Iono':
      return calculateIonoOdds(params);
    
    case 'Mars':
      return calculateMarsOdds(params);
    
    case 'Red Card':
      return calculateRedCardResult();
    
    default:
      return {
        worthIt: false,
        explanation: 'Select a card to calculate odds.',
        details: null
      };
  }
};

export { calculateOdds, hypergeometricProbability, combination, factorial };
