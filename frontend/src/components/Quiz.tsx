/**
 * Quiz Component - Main Quiz Interface
 * Filipino Adaptive Quiz Application
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  LinearProgress,
  Chip,
  Alert,
  Rating,
  Stack,
  Paper,
  Divider
} from '@mui/material';
import {
  Timer,
  CheckCircle,
  Cancel,
  Star,
  TrendingUp
} from '@mui/icons-material';

interface QuizProps {
  sessionId: string;
  onComplete: (results: any) => void;
}

interface Question {
  id: string;
  questionText: string;
  options: Array<{
    id: string;
    text: string;
  }>;
  points: number;
  difficultyLevel: number;
}

const Quiz: React.FC<QuizProps> = ({ sessionId, onComplete }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState(3);
  const [currentScore, setCurrentScore] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [feedback, setFeedback] = useState<{
    show: boolean;
    isCorrect: boolean;
    message: string;
    pointsEarned: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleSubmitAnswer = async () => {
    if (!selectedOption) {
      alert('Pumili ng sagot / Please select an answer');
      return;
    }

    setLoading(true);

    try {
      // API call to submit answer
      const response = await fetch('/api/quiz/submit-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          selectedOptionId: selectedOption,
          confidenceLevel,
          timeSpent
        })
      });

      const result = await response.json();

      if (result.success) {
        setFeedback({
          show: true,
          isCorrect: result.data.isCorrect,
          message: result.data.feedback,
          pointsEarned: result.data.pointsEarned
        });

        setCurrentScore(result.data.currentScore);

        // Move to next question after delay
        setTimeout(() => {
          if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption('');
            setConfidenceLevel(3);
            setTimeSpent(0);
            setFeedback(null);
          } else {
            handleCompleteQuiz();
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      alert('May nangyaring error / An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteQuiz = async () => {
    try {
      const response = await fetch('/api/quiz/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ sessionId })
      });

      const result = await response.json();

      if (result.success) {
        onComplete(result.data);
      }
    } catch (error) {
      console.error('Error completing quiz:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentQuestion) {
    return <Typography>Naglo-load... / Loading...</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 900, margin: '0 auto', padding: 3 }}>
      {/* Header - Score and Progress */}
      <Paper elevation={3} sx={{ padding: 2, marginBottom: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" color="primary" fontWeight="bold">
              {currentScore.toFixed(1)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Kasalukuyang Iskor / Current Score
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <Timer />
            <Typography variant="h6">{formatTime(timeSpent)}</Typography>
          </Box>

          <Box>
            <Typography variant="body1">
              Tanong {currentQuestionIndex + 1} ng {questions.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ marginTop: 2 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>
      </Paper>

      {/* Feedback Alert */}
      {feedback?.show && (
        <Alert
          severity={feedback.isCorrect ? 'success' : 'error'}
          icon={feedback.isCorrect ? <CheckCircle /> : <Cancel />}
          sx={{ marginBottom: 3 }}
        >
          <Typography variant="h6">
            {feedback.isCorrect ? 'Tama! / Correct!' : 'Mali / Incorrect'}
          </Typography>
          <Typography>{feedback.message}</Typography>
          <Typography variant="body2">
            Puntos: {feedback.pointsEarned > 0 ? '+' : ''}{feedback.pointsEarned.toFixed(1)}
          </Typography>
        </Alert>
      )}

      {/* Question Card */}
      <Card elevation={2}>
        <CardContent>
          {/* Difficulty Badge */}
          <Box display="flex" justifyContent="space-between" marginBottom={2}>
            <Chip
              label={`Difficulty ${currentQuestion.difficultyLevel}/5`}
              color="primary"
              size="small"
              icon={<Star />}
            />
            <Chip
              label={`${currentQuestion.points} ${currentQuestion.points === 1 ? 'punto / point' : 'puntos / points'}`}
              variant="outlined"
              size="small"
            />
          </Box>

          {/* Question Text */}
          <Typography variant="h5" gutterBottom fontWeight="medium">
            {currentQuestion.questionText}
          </Typography>

          <Divider sx={{ marginY: 3 }} />

          {/* Answer Options */}
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={selectedOption}
              onChange={(e) => setSelectedOption(e.target.value)}
            >
              {currentQuestion.options.map((option) => (
                <Paper
                  key={option.id}
                  elevation={selectedOption === option.id ? 3 : 0}
                  sx={{
                    padding: 2,
                    marginBottom: 1.5,
                    border: selectedOption === option.id ? '2px solid' : '1px solid',
                    borderColor: selectedOption === option.id ? 'primary.main' : 'divider',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      elevation: 2
                    }
                  }}
                  onClick={() => setSelectedOption(option.id)}
                >
                  <FormControlLabel
                    value={option.id}
                    control={<Radio />}
                    label={
                      <Typography variant="body1">
                        {option.text}
                      </Typography>
                    }
                    sx={{ margin: 0, width: '100%' }}
                  />
                </Paper>
              ))}
            </RadioGroup>
          </FormControl>

          {/* Confidence Rating */}
          <Box marginTop={4}>
            <Typography variant="body2" gutterBottom>
              Gaano ka kasigurado sa iyong sagot? / How confident are you?
            </Typography>
            <Rating
              value={confidenceLevel}
              onChange={(_, newValue) => setConfidenceLevel(newValue || 3)}
              max={5}
              size="large"
            />
            <Typography variant="caption" color="text.secondary">
              1 = Hindi sigurado / Not sure | 5 = Lubhang sigurado / Very sure
            </Typography>
          </Box>

          {/* Submit Button */}
          <Box marginTop={4}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleSubmitAnswer}
              disabled={!selectedOption || loading || feedback?.show}
              startIcon={<TrendingUp />}
            >
              {loading
                ? 'Sinusumite... / Submitting...'
                : 'Isumite ang Sagot / Submit Answer'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Quiz;
