const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const User = require('../models/User');

// @desc    Get admin dashboard analytics
// @route   GET /api/analytics/admin
// @access  Private/Admin
exports.getAdminAnalytics = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Get admin's quizzes
    const quizzes = await Quiz.find({ createdBy: adminId });
    const quizIds = quizzes.map(quiz => quiz._id);

    // Get results for admin's quizzes
    const results = await Result.find({ quizId: { $in: quizIds } });

    // Calculate metrics
    const totalQuizzes = quizzes.length;
    const totalQuestions = quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0);
    
    // Get unique users who took admin's quizzes
    const uniqueUserIds = [...new Set(results.map(result => result.userId.toString()))];
    const totalUsers = uniqueUserIds.length;

    // Calculate average score
    const averageScore = results.length > 0 
      ? results.reduce((sum, result) => sum + result.percentage, 0) / results.length 
      : 0;

    // Get recent activity (last 10 results)
    const recentActivity = await Result.find({ quizId: { $in: quizIds } })
      .populate('userId', 'username profile')
      .populate('quizId', 'title')
      .sort({ completedAt: -1 })
      .limit(10)
      .select('userName score percentage timeTaken completedAt quizId');

    res.json({
      success: true,
      data: {
        totalQuizzes,
        totalUsers,
        totalQuestions,
        averageScore: Math.round(averageScore * 100) / 100,
        totalAttempts: results.length,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin analytics'
    });
  }
};

// @desc    Get admin quiz analytics
// @route   GET /api/analytics/admin/quizzes
// @access  Private/Admin
exports.getAdminQuizAnalytics = async (req, res) => {
  try {
    const adminId = req.user.id;

    const quizzes = await Quiz.find({ createdBy: adminId })
      .select('title category difficulty stats timesTaken averageScore createdAt')
      .sort({ 'stats.timesTaken': -1 });

    const quizAnalytics = await Promise.all(
      quizzes.map(async (quiz) => {
        const results = await Result.find({ quizId: quiz._id });
        const uniqueUsers = [...new Set(results.map(result => result.userId.toString()))].length;
        
        return {
          id: quiz._id,
          title: quiz.title,
          category: quiz.category,
          difficulty: quiz.difficulty,
          timesTaken: quiz.stats.timesTaken,
          uniqueUsers,
          averageScore: quiz.stats.averageScore,
          createdAt: quiz.createdAt
        };
      })
    );

    res.json({
      success: true,
      data: quizAnalytics
    });
  } catch (error) {
    console.error('Admin quiz analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quiz analytics'
    });
  }
};

// @desc    Get admin user analytics
// @route   GET /api/analytics/admin/users
// @access  Private/Admin
exports.getAdminUserAnalytics = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Get admin's quizzes
    const quizzes = await Quiz.find({ createdBy: adminId });
    const quizIds = quizzes.map(quiz => quiz._id);

    // Get results for admin's quizzes and group by user
    const results = await Result.find({ quizId: { $in: quizIds } })
      .populate('userId', 'username profile createdAt')
      .sort({ completedAt: -1 });

    // Group results by user
    const userResults = {};
    results.forEach(result => {
      const userId = result.userId._id.toString();
      if (!userResults[userId]) {
        userResults[userId] = {
          user: result.userId,
          attempts: [],
          totalQuizzesTaken: 0,
          averageScore: 0
        };
      }
      userResults[userId].attempts.push(result);
    });

    // Calculate metrics for each user
    const userAnalytics = Object.values(userResults).map(userData => {
      const attempts = userData.attempts;
      const totalQuizzesTaken = [...new Set(attempts.map(attempt => attempt.quizId.toString()))].length;
      const averageScore = attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length;

      return {
        user: {
          id: userData.user._id,
          username: userData.user.username,
          fullName: userData.user.profile?.firstName && userData.user.profile?.lastName 
            ? `${userData.user.profile.firstName} ${userData.user.profile.lastName}`
            : userData.user.username,
          joinedDate: userData.user.createdAt
        },
        totalQuizzesTaken,
        totalAttempts: attempts.length,
        averageScore: Math.round(averageScore * 100) / 100,
        lastActivity: attempts[0]?.completedAt
      };
    });

    res.json({
      success: true,
      data: userAnalytics
    });
  } catch (error) {
    console.error('Admin user analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user analytics'
    });
  }
};

// @desc    Get score distribution for admin's quizzes
// @route   GET /api/analytics/admin/score-distribution
// @access  Private/Admin
exports.getAdminScoreDistribution = async (req, res) => {
  try {
    const adminId = req.user.id;

    const quizzes = await Quiz.find({ createdBy: adminId });
    const quizIds = quizzes.map(quiz => quiz._id);

    const results = await Result.find({ quizId: { $in: quizIds } });

    // Calculate score distribution
    const distribution = [
      { range: '0-20%', count: 0 },
      { range: '21-40%', count: 0 },
      { range: '41-60%', count: 0 },
      { range: '61-80%', count: 0 },
      { range: '81-100%', count: 0 }
    ];

    results.forEach(result => {
      const percentage = result.percentage;
      if (percentage <= 20) distribution[0].count++;
      else if (percentage <= 40) distribution[1].count++;
      else if (percentage <= 60) distribution[2].count++;
      else if (percentage <= 80) distribution[3].count++;
      else distribution[4].count++;
    });

    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('Score distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching score distribution'
    });
  }
};

// @desc    Get popular quizzes for admin
// @route   GET /api/analytics/admin/popular-quizzes
// @access  Private/Admin
exports.getAdminPopularQuizzes = async (req, res) => {
  try {
    const adminId = req.user.id;

    const popularQuizzes = await Quiz.find({ createdBy: adminId })
      .select('title category difficulty stats timesTaken averageScore')
      .sort({ 'stats.timesTaken': -1 })
      .limit(10);

    const popularQuizzesData = await Promise.all(
      popularQuizzes.map(async (quiz) => {
        const uniqueUsers = await Result.distinct('userId', { quizId: quiz._id });
        
        return {
          id: quiz._id,
          title: quiz.title,
          category: quiz.category,
          participants: uniqueUsers.length,
          totalAttempts: quiz.stats.timesTaken,
          averageScore: Math.round(quiz.stats.averageScore * 100) / 100
        };
      })
    );

    res.json({
      success: true,
      data: popularQuizzesData
    });
  } catch (error) {
    console.error('Popular quizzes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular quizzes'
    });
  }
};

// @desc    Get recent activity for admin
// @route   GET /api/analytics/admin/recent-activity
// @access  Private/Admin
exports.getAdminRecentActivity = async (req, res) => {
  try {
    const adminId = req.user.id;

    const quizzes = await Quiz.find({ createdBy: adminId });
    const quizIds = quizzes.map(quiz => quiz._id);

    const recentActivity = await Result.find({ quizId: { $in: quizIds } })
      .populate('userId', 'username profile')
      .populate('quizId', 'title category')
      .sort({ completedAt: -1 })
      .limit(20)
      .select('userName score percentage timeTaken completedAt quizId');

    const activityData = recentActivity.map(activity => ({
      id: activity._id,
      userName: activity.userName,
      quizTitle: activity.quizId.title,
      quizCategory: activity.quizId.category,
      score: activity.score,
      percentage: activity.percentage,
      timeTaken: activity.timeTaken,
      completedAt: activity.completedAt,
      passed: activity.percentage >= 60
    }));

    res.json({
      success: true,
      data: activityData
    });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activity'
    });
  }
};