import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // List of available cards - add new cards here
  const availableCards = ['Iono', 'Mars', 'Red Card'];
  
  // State variables for form inputs
  const [card, setCard] = useState(availableCards[0]);
  const [cardsInDeck, setCardsInDeck] = useState(20);
  const [cardsInHand, setCardsInHand] = useState(5);
  const [uniqueCardsNeeded, setUniqueCardsNeeded] = useState(1);
  
  // Arrays to track remaining and in-hand counts for each unique card needed
  const [remainingInDeck, setRemainingInDeck] = useState([1]);
  const [inHand, setInHand] = useState([0]);
  
  // Validation errors
  const [errors, setErrors] = useState({
    cardsInDeck: '',
    cardsInHand: '',
    uniqueCardsNeeded: '',
    remainingInDeck: Array(3).fill(''),
    inHand: Array(3).fill('')
  });

  // Additional state for deck+hand validation
  const [totalCardsError, setTotalCardsError] = useState('');
  
  // Result state
  const [result, setResult] = useState(null);
  
  // Detailed calculation results
  const [detailedResults, setDetailedResults] = useState(null);
  
  // Update arrays when uniqueCardsNeeded changes
  useEffect(() => {
    setRemainingInDeck(prev => {
      const newArray = [...prev];
      // Resize array to match uniqueCardsNeeded
      while (newArray.length < uniqueCardsNeeded) {
        newArray.push(1);
      }
      return newArray.slice(0, uniqueCardsNeeded);
    });
    
    setInHand(prev => {
      const newArray = [...prev];
      // Resize array to match uniqueCardsNeeded
      while (newArray.length < uniqueCardsNeeded) {
        newArray.push(0);
      }
      return newArray.slice(0, uniqueCardsNeeded);
    });
    
    // Reset validation errors for the arrays
    setErrors(prev => ({
      ...prev,
      remainingInDeck: Array(uniqueCardsNeeded).fill(''),
      inHand: Array(uniqueCardsNeeded).fill('')
    }));
  }, [uniqueCardsNeeded]);
  
  // Initial validation of total cards
  useEffect(() => {
    setTotalCardsError(validateTotalCards(cardsInDeck, cardsInHand));
  }, []);
  
  // Validate input fields
  const validateField = (field, value, min, max) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < min || numValue > max) {
      return `Value must be between ${min} and ${max}`;
    }
    return '';
  };

  // Validate total cards (deck + hand <= 20)
  const validateTotalCards = (deckCount, handCount) => {
    const total = deckCount + handCount;
    if (total > 20) {
      return 'Total cards (deck + hand) cannot exceed 20';
    }
    return '';
  };
  
  // Helper function to handle remaining in deck changes
  const handleRemainingChange = (index, value) => {
    const newRemaining = [...remainingInDeck];
    newRemaining[index] = parseInt(value) || 0;
    setRemainingInDeck(newRemaining);
    
    // Validate
    const newErrors = {...errors};
    newErrors.remainingInDeck[index] = validateField('remainingInDeck', value, 1, 2);
    setErrors(newErrors);
  };
  
  // Helper function to handle in hand changes
  const handleInHandChange = (index, value) => {
    const newInHand = [...inHand];
    newInHand[index] = parseInt(value) || 0;
    setInHand(newInHand);
    
    // Validate
    const newErrors = {...errors};
    newErrors.inHand[index] = validateField('inHand', value, 0, 2);
    setErrors(newErrors);
  };
  
  // Handle deck count change with validation
  const handleDeckCountChange = (value) => {
    const newDeckCount = parseInt(value) || 0;
    setCardsInDeck(newDeckCount);
    
    // Validate individual field
    setErrors({
      ...errors,
      cardsInDeck: validateField('cardsInDeck', value, 1, 20)
    });
    
    // Validate total cards
    setTotalCardsError(validateTotalCards(newDeckCount, cardsInHand));
  };
  
  // Handle hand count change with validation
  const handleHandCountChange = (value) => {
    const newHandCount = parseInt(value) || 0;
    setCardsInHand(newHandCount);
    
    // Validate individual field
    setErrors({
      ...errors,
      cardsInHand: validateField('cardsInHand', value, 1, 8)
    });
    
    // Validate total cards
    setTotalCardsError(validateTotalCards(cardsInDeck, newHandCount));
  };
  
  // Handle unique cards needed change with validation
  const handleUniqueCardsChange = (value) => {
    setUniqueCardsNeeded(parseInt(value) || 1);
    setErrors({
      ...errors,
      uniqueCardsNeeded: validateField('uniqueCardsNeeded', value, 1, 3)
    });
  };

  // Handle card selection and clear results
  const handleCardChange = (selectedCard) => {
    setCard(selectedCard);
    // Clear results when card selection changes
    setResult(null);
    setDetailedResults(null);
  };
  
  // Calculate odds based on the selected card and parameters
  const calculateOdds = () => {
    // Check for validation errors before calculating
    for (const key in errors) {
      if (typeof errors[key] === 'string' && errors[key]) {
        setResult({
          worthIt: false,
          explanation: 'Please fix the validation errors before calculating.'
        });
        setDetailedResults(null);
        return;
      } else if (Array.isArray(errors[key]) && errors[key].some(err => err)) {
        setResult({
          worthIt: false,
          explanation: 'Please fix the validation errors before calculating.'
        });
        setDetailedResults(null);
        return;
      }
    }
    
    // Check for total cards error
    if (totalCardsError) {
      setResult({
        worthIt: false,
        explanation: totalCardsError
      });
      setDetailedResults(null);
      return;
    }
    
    let worthIt = false;
    let explanation = '';
    
    // Basic validations
    const totalCardsAccounted = cardsInHand + cardsInDeck;
    if (totalCardsAccounted <= 0) {
      setResult({
        worthIt: false,
        explanation: 'Invalid deck/hand configuration.'
      });
      return;
    }
    
    // Different calculations based on the card
    switch(card) {
      case 'Iono':
        // Iono lets you draw until you have 7 cards in hand
        const newHandSize = 7;
        const cardsToDraw = Math.max(0, newHandSize - cardsInHand);
        
        if (cardsToDraw === 0) {
          worthIt = false;
          explanation = 'You already have 7 or more cards in hand, no need to play Iono.';
          setDetailedResults({
            cardName: 'Iono',
            cardEffect: 'Draw until you have 7 cards in hand',
            currentHandSize: cardsInHand,
            cardsToDraw: cardsToDraw,
            cardsInDeck: cardsInDeck,
            odds: []
          });
        } else {
          // Calculate odds for each needed card and combine them
          let combinedOdds = 1;
          let allCardsFound = true;
          const cardOdds = [];
          
          for (let i = 0; i < uniqueCardsNeeded; i++) {
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
          
          worthIt = combinedOdds > 0.5 || allCardsFound;
          explanation = `Playing Iono will draw ${cardsToDraw} cards. `;
          explanation += `Chance of getting needed card(s): ${(combinedOdds * 100).toFixed(2)}%. `;
          explanation += worthIt ? 'Worth playing!' : 'Probably not worth playing.';
          
          setDetailedResults({
            cardName: 'Iono',
            cardEffect: 'Draw until you have 7 cards in hand',
            currentHandSize: cardsInHand,
            cardsToDraw: cardsToDraw,
            cardsInDeck: cardsInDeck,
            combinedOdds: (combinedOdds * 100).toFixed(2),
            odds: cardOdds
          });
        }
        break;
        
      case 'Mars':
        // Mars lets you discard your hand and draw 4 new cards
        const marsDraw = 4;
        
        // Calculate odds for each needed card and combine them
        let marsOdds = 1;
        let anyCardsInHand = false;
        const cardOdds = [];
        
        // Check if any needed cards are already in hand
        for (let i = 0; i < uniqueCardsNeeded; i++) {
          if (inHand[i] > 0) anyCardsInHand = true;
        }
        
        for (let i = 0; i < uniqueCardsNeeded; i++) {
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
        worthIt = marsOdds > (anyCardsInHand ? 0.7 : 0.5);
        explanation = `Playing Mars will discard your current hand and draw ${marsDraw} new cards. `;
        
        if (anyCardsInHand) {
          explanation += 'Warning: You already have some needed cards in hand. ';
        }
        
        explanation += `Chance of getting all needed cards: ${(marsOdds * 100).toFixed(2)}%. `;
        explanation += worthIt ? 'Worth playing!' : 'Probably not worth playing.';
        
        setDetailedResults({
          cardName: 'Mars',
          cardEffect: 'Discard your hand and draw 4 new cards',
          cardsDiscarded: cardsInHand,
          cardsToDraw: marsDraw,
          cardsInDeck: cardsInDeck,
          hasCardsInHand: anyCardsInHand,
          combinedOdds: (marsOdds * 100).toFixed(2),
          thresholdUsed: anyCardsInHand ? '70%' : '50%',
          odds: cardOdds
        });
        break;
        
      case 'Red Card':
        // Red Card makes opponent discard and draw 4
        worthIt = true; // Simplified - always good to disrupt opponent
        explanation = 'Red Card disrupts your opponent\'s hand, generally worth playing if it fits your strategy.';
        
        setDetailedResults({
          cardName: 'Red Card',
          cardEffect: 'Your opponent discards their hand and draws 4 cards',
          strategicValue: 'High',
          disruptionPotential: 'Forces opponent to discard potentially valuable cards',
          recommendation: 'Consider the game state - best played when opponent has a large or valuable hand'
        });
        break;
        
      default:
        explanation = 'Select a card to calculate odds.';
        setDetailedResults(null);
    }
    
    setResult({ worthIt, explanation });
  };
  
  // Hypergeometric probability function (probability of drawing at least x successes)
  const hypergeometricProbability = (population, successes, sampleSize, minSuccesses) => {
    // Implementation of hypergeometric distribution
    if (sampleSize > population) return 0;
    if (successes > population) return 0;
    if (minSuccesses > successes) return 0;
    if (minSuccesses > sampleSize) return 0;
    
    // Calculate the probability of at least minSuccesses
    let probability = 0;
    
    // Sum the probabilities of drawing exactly i successes, for i from minSuccesses to min(successes, sampleSize)
    for (let i = minSuccesses; i <= Math.min(successes, sampleSize); i++) {
      // Calculate combinations: C(successes, i) * C(population - successes, sampleSize - i) / C(population, sampleSize)
      const numerator = combination(successes, i) * combination(population - successes, sampleSize - i);
      const denominator = combination(population, sampleSize);
      probability += numerator / denominator;
    }
    
    return probability;
  };
  
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
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>PTCGP Draw Odds Calculator</h1>
        <div className="calculator-container">
          <div className="form-group card-selection">
            <label>Select Card:</label>
            <div className="radio-group">
              {availableCards.map((cardName) => (
                <label key={cardName} className="radio-label">
                  <input 
                    type="radio" 
                    name="card" 
                    value={cardName} 
                    checked={card === cardName}
                    onChange={() => handleCardChange(cardName)}
                  />
                  <span className="radio-text">{cardName}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label>Cards in Deck:</label>
            <div className="input-container">
              <input 
                type="number" 
                min="1" 
                max="20" 
                value={cardsInDeck} 
                onChange={(e) => handleDeckCountChange(e.target.value)}
              />
              {errors.cardsInDeck && <div className="error-message">{errors.cardsInDeck}</div>}
            </div>
          </div>
          
          <div className="form-group">
            <label>Cards in Hand:</label>
            <div className="input-container">
              <input 
                type="number" 
                min="1" 
                max="8" 
                value={cardsInHand} 
                onChange={(e) => handleHandCountChange(e.target.value)}
              />
              {errors.cardsInHand && <div className="error-message">{errors.cardsInHand}</div>}
            </div>
          </div>
          
          {totalCardsError && (
            <div className="total-cards-error">
              <div className="error-message">{totalCardsError}</div>
            </div>
          )}
          
          <div className="form-group">
            <label>Number of Unique Cards Needed:</label>
            <div className="input-container">
              <input 
                type="number" 
                min="1" 
                max="3" 
                value={uniqueCardsNeeded} 
                onChange={(e) => handleUniqueCardsChange(e.target.value)}
              />
              {errors.uniqueCardsNeeded && <div className="error-message">{errors.uniqueCardsNeeded}</div>}
            </div>
          </div>
          
          {/* Dynamic fields based on unique cards needed */}
          {[...Array(uniqueCardsNeeded)].map((_, index) => (
            <div key={index} className="unique-card-group">
              <h3>Card {index + 1}</h3>
              
              <div className="form-group">
                <label>Remaining in Deck:</label>
                <div className="input-container">
                  <input 
                    type="number" 
                    min="1" 
                    max="2" 
                    value={remainingInDeck[index]} 
                    onChange={(e) => handleRemainingChange(index, e.target.value)}
                  />
                  {errors.remainingInDeck[index] && <div className="error-message">{errors.remainingInDeck[index]}</div>}
                </div>
              </div>
              
              <div className="form-group">
                <label>In Hand Already:</label>
                <div className="input-container">
                  <input 
                    type="number" 
                    min="0" 
                    max="2" 
                    value={inHand[index]} 
                    onChange={(e) => handleInHandChange(index, e.target.value)}
                  />
                  {errors.inHand[index] && <div className="error-message">{errors.inHand[index]}</div>}
                </div>
              </div>
            </div>
          ))}
          
          <button className="calculate-button" onClick={calculateOdds}>
            Calculate
          </button>
          
          {result && (
            <div className={`result ${result.worthIt ? 'worth-it' : 'not-worth-it'}`}>
              <h2>{result.worthIt ? 'Worth Playing' : 'Not Worth Playing'}</h2>
              <p>{result.explanation}</p>
            </div>
          )}
          
          {detailedResults && (
            <div className="detailed-results">
              <h2>Calculation Details</h2>
              <div className="details-container">
                <div className="detail-row">
                  <span className="detail-label">Card:</span>
                  <span className="detail-value">{detailedResults.cardName}</span>
                </div>
                
                {detailedResults.cardEffect && (
                  <div className="detail-row">
                    <span className="detail-label">Effect:</span>
                    <span className="detail-value">{detailedResults.cardEffect}</span>
                  </div>
                )}
                
                {detailedResults.cardsToDraw !== undefined && (
                  <div className="detail-row">
                    <span className="detail-label">Cards to Draw:</span>
                    <span className="detail-value">{detailedResults.cardsToDraw}</span>
                  </div>
                )}
                
                {detailedResults.combinedOdds !== undefined && (
                  <div className="detail-row highlight-row">
                    <span className="detail-label">Total Odds:</span>
                    <span className="detail-value">{detailedResults.combinedOdds}%</span>
                  </div>
                )}
                
                {detailedResults.hasCardsInHand && (
                  <div className="detail-row warning-row">
                    <span className="detail-label">Warning:</span>
                    <span className="detail-value">Card(s) will be discarded from hand</span>
                  </div>
                )}
                
                {detailedResults.strategicValue && (
                  <div className="detail-row">
                    <span className="detail-label">Strategic Value:</span>
                    <span className="detail-value">{detailedResults.strategicValue}</span>
                  </div>
                )}
                
                {detailedResults.recommendation && (
                  <div className="detail-row">
                    <span className="detail-label">Recommendation:</span>
                    <span className="detail-value">{detailedResults.recommendation}</span>
                  </div>
                )}
                
                {detailedResults.odds && detailedResults.odds.length > 0 && (
                  <>
                    <h3>Card-by-Card Odds</h3>
                    <div className="odds-table">
                      <div className="odds-header">
                        <div>Card</div>
                        <div>In Hand</div>
                        <div>In Deck</div>
                        <div>Draw Chance</div>
                      </div>
                      {detailedResults.odds.map((cardOdds, index) => (
                        <div key={index} className={`odds-row ${cardOdds.willDiscard ? 'warning-row' : ''}`}>
                          <div>Card {cardOdds.cardIndex}</div>
                          <div>{cardOdds.inHand}</div>
                          <div>{cardOdds.remainingInDeck}</div>
                          <div className={parseFloat(cardOdds.odds) > 50 ? 'good-odds' : 'poor-odds'}>
                            {cardOdds.odds}%
                            {cardOdds.willDiscard && <span className="discard-note"> (will discard)</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
