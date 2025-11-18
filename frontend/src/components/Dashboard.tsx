/**
 * Dashboard Component - Analytics and Progress Tracking
 * Filipino Adaptive Quiz Application
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Stack
} from '@mui/material';
import {
  TrendingUp,
  EmojiEvents,
  LocalFireDepartment,
  School,
  Timer,
  CheckCircle
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface DashboardProps {
  userId: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userId }) => {
  const [stats, setStats] = useState({
    overallProgress: {
      totalQuizzes: 0,
      averageScore: 0,
      totalTimeSpent: 0,
      currentStreak: 0
    },
    topicProgress: [] as Array<{
      topicId: string;
      topicName: string;
      accuracy: number;
      questionsAttempted: number;
      strengthScore: number;
    }>,
    recentSessions: [] as Array<{
      id: string;
      topicName: string;
      score: number;
      completedAt: string;
    }>,
    performanceTrend: {
      dates: [] as string[],
      scores: [] as number[]
    }
  });

  const [achievements, setAchievements] = useState<Array<{
    id: string;
    name: string;
    description: string;
    iconUrl: string;
    earnedAt: string;
  }>>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/analytics/user-progress', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Box sx={{ padding: 3 }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard ng Pag-aaral / Learning Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" marginBottom={4}>
        Subaybayan ang iyong pag-unlad / Track your progress
      </Typography>

      {/* Stats Overview Cards */}
      <Grid container spacing={3} marginBottom={4}>
        {/* Total Quizzes */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <School />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.overallProgress.totalQuizzes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Mga Quiz
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Average Score */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.overallProgress.averageScore.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Score
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Streak */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                  <LocalFireDepartment />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.overallProgress.currentStreak}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Day Streak
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Time */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                  <Timer />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {formatTime(stats.overallProgress.totalTimeSpent)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Oras ng Pag-aaral
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Trend Chart */}
      <Grid container spacing={3} marginBottom={4}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ padding: 3 }}>
            <Typography variant="h6" gutterBottom>
              Takbo ng Performance / Performance Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.performanceTrend.dates.map((date, index) => ({
                date,
                score: stats.performanceTrend.scores[index]
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Iskor / Score (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Achievements */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ padding: 3, height: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1} marginBottom={2}>
              <EmojiEvents color="primary" />
              <Typography variant="h6">
                Mga Parangal / Achievements
              </Typography>
            </Stack>
            <List>
              {achievements.slice(0, 5).map((achievement) => (
                <ListItem key={achievement.id}>
                  <ListItemAvatar>
                    <Avatar src={achievement.iconUrl} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={achievement.name}
                    secondary={achievement.description}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* Topic Progress */}
      <Paper elevation={2} sx={{ padding: 3, marginBottom: 4 }}>
        <Typography variant="h6" gutterBottom>
          Pag-unlad sa Bawat Paksa / Progress by Topic
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.topicProgress}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="topicName" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="accuracy" fill="#82ca9d" name="Accuracy %" />
            <Bar dataKey="strengthScore" fill="#8884d8" name="Strength Score" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Topic Details */}
      <Paper elevation={2} sx={{ padding: 3 }}>
        <Typography variant="h6" gutterBottom>
          Detalye ng mga Paksa / Topic Details
        </Typography>
        <List>
          {stats.topicProgress.map((topic, index) => (
            <React.Fragment key={topic.topicId}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <CheckCircle />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={topic.topicName}
                  secondary={`${topic.questionsAttempted} tanong / questions`}
                />
                <Box sx={{ minWidth: 200 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LinearProgress
                      variant="determinate"
                      value={topic.accuracy}
                      sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                    />
                    <Chip
                      label={`${topic.accuracy.toFixed(0)}%`}
                      size="small"
                      color={topic.accuracy >= 80 ? 'success' : topic.accuracy >= 60 ? 'warning' : 'error'}
                    />
                  </Stack>
                </Box>
              </ListItem>
              {index < stats.topicProgress.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default Dashboard;
