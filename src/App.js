import { useState, useEffect } from 'react';
import { getAvailableCards, getCard } from './data/cards';
import { calculateOdds } from './utils/calculations';
import './App.css';

function App() {
  // List of available cards from cards.js
  const availableCards = getAvailableCards();
  
  // State variables for form inputs
  const [card, setCard] = useState(availableCards[0]);
  const [cardUser, setCardUser] = useState(getCard(availableCards[0]).affects);
  const [cardsInDeck, setCardsInDeck] = useState(14);
  const [cardsInHand, setCardsInHand] = useState(5);
  const [uniqueCardsNeeded, setUniqueCardsNeeded] = useState(1);
  const [opponentPoints, setOpponentPoints] = useState(1);
  const [userPoints, setUserPoints] = useState(1);
  
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
    // Update cardUser state
    setCardUser(getCard(selectedCard).affects);
    // Clear results when card selection changes
    setResult(null);
    setDetailedResults(null);
  };
  
  // Calculate odds based on the selected card and parameters
  const handleCalculateOdds = () => {
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
    
    // Call the calculation utility with our parameters
    const calculationResult = calculateOdds({
      cardName: card,
      cardUser: cardUser,
      cardsInDeck,
      cardsInHand,
      remainingInDeck,
      inHand,
      uniqueCardsNeeded,
      opponentPoints,
      userPoints
    });
    
    // Update state with the calculation results
    setResult({ 
      worthIt: calculationResult.worthIt, 
      explanation: calculationResult.explanation 
    });
    
    setDetailedResults(calculationResult.details);
  };
  // Mathematical functions moved to utils/calculations.js
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>PTCGP Draw Odds Calculator</h1>
        <div className="calculator-container">
          <div className="form-group card-selection">
            <label>Select Card:</label>
            <div className="radio-group">
              {availableCards.map((cardName) => {
                const cardType = getCard(cardName).affects;
                return (
                  <label key={cardName} className={`radio-label ${cardType === 'opponent' ? 'opponent-card' : ''}`}>
                    <input 
                      type="radio" 
                      name="card" 
                      value={cardName} 
                      checked={card === cardName}
                      onChange={() => handleCardChange(cardName)}
                    />
                    <span className="radio-text">{cardName}</span>
                  </label>
                );
              })}
            </div>
          </div>
          
          {/* Display card description right after selection */}
          <div className="form-group card-description">
            <div className="card-effect-container">
              <p className="card-effect-text">{getCard(card).effect}</p>
            </div>
          </div>
          
          <div className="form-group">
            <label>{cardUser === 'opponent' ? 'Cards in Opponent\'s Deck:' : 'Cards in Deck:'}</label>
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
            <label>{cardUser === 'opponent' ? 'Cards in Opponent\'s Hand:' : 'Cards in Hand:'}</label>
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
          
          {/* Points input field for cards that depend on points */}
          {getCard(card).calculationParams.points && (
            <div className="form-group">
              <label>
                {getCard(card).affects === 'opponent' 
                  ? 'Number of Opponent Points:' 
                  : 'Number of Your Points:'}
              </label>
              <div className="input-container">
                <input 
                  type="number" 
                  min="0" 
                  max="2" 
                  value={getCard(card).affects === 'opponent' ? opponentPoints : userPoints} 
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    if (getCard(card).affects === 'opponent') {
                      setOpponentPoints(value);
                    } else {
                      setUserPoints(value);
                    }
                  }}
                />
              </div>
            </div>
          )}
          
          {/* Dynamic fields based on unique cards needed */}
          {[...Array(uniqueCardsNeeded)].map((_, index) => (
            <div key={index} className="unique-card-group">
              <h3>Card {index + 1}</h3>
              
              <div className="form-group">
                <label>{cardUser === 'opponent' ? 'Remaining in Deck or Hand:' : 'Remaining in Deck:'}</label>
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
                <label>{cardUser === 'opponent' ? 'Remaining in Deck or Hand:' : 'In Hand Already:'}</label>
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
          
          <button className="calculate-button" onClick={handleCalculateOdds}>
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
                
                {detailedResults.cardsToDraw !== undefined && (
                  <div className="detail-row">
                    <span className="detail-label">{cardUser === 'opponent' ? 'Cards Opponent Will Draw:' : 'Cards to Draw:'}</span>
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
                    <span className="detail-value">
                      {cardUser === 'opponent' 
                        ? 'Opponent will discard needed card(s)' 
                        : 'Card(s) will be discarded from hand'}
                    </span>
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
                        <div>{cardUser === 'opponent' ? 'In Deck/Hand' : 'In Hand'}</div>
                        <div>{cardUser === 'opponent' ? 'In Deck/Hand' : 'In Deck'}</div>
                        <div>Draw Chance</div>
                      </div>
                      {detailedResults.odds.map((cardOdds, index) => (
                        <div key={index} className={`odds-row ${cardOdds.willDiscard ? 'warning-row' : ''}`}>
                          <div>Card {cardOdds.cardIndex}</div>
                          <div>{cardOdds.inHand}</div>
                          <div>{cardOdds.remainingInDeck}</div>
                          <div className={parseFloat(cardOdds.odds) > 50 ? 'good-odds' : 'poor-odds'}>
                            {cardOdds.odds}%
                            {cardOdds.willDiscard && 
                              <span className="discard-note">
                                {cardUser === 'opponent' 
                                  ? ' (opponent will discard)' 
                                  : ' (will discard)'}
                              </span>
                            }
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
