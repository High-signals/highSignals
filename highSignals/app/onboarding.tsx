import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';

// ICP Questions configuration
const ICP_QUESTIONS = [
  {
    id: 1,
    question: "In one sentence, what is your specific profession or niche?",
    placeholder: "E.g., I'm a fitness coach for busy professionals",
    required: true,
    multiline: false,
  },
  {
    id: 2,
    question: "Who is the one dream client you would like to offer your services to?",
    placeholder: "Describe your ideal client in detail",
    required: true,
    multiline: true,
  },
  {
    id: 3,
    question: "What is the #1 problem you are trying to solve for this person that keeps them awake?",
    placeholder: "What's their biggest pain point or struggle?",
    required: true,
    multiline: true,
  },
  {
    id: 4,
    question: "If you fix their problem, how will their life look like afterwards? What is their ultimate dream outcome?",
    placeholder: "Paint a picture of their ideal transformation",
    required: true,
    multiline: true,
  },
  {
    id: 5,
    question: "Why are you the right person to help them? Briefly tell me a personal story or experience that built your expertise.",
    placeholder: "Share your unique story and qualifications",
    required: true,
    multiline: true,
  },
  {
    id: 6,
    question: "Write out what their demographics are",
    placeholder: "E.g., 20-30 year old male in Africa",
    required: true,
    multiline: false,
  },
  {
    id: 7,
    question: "Any other details you want to write about your target audience?",
    placeholder: "Additional insights, behaviors, interests, etc.",
    required: false,
    multiline: true,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [currentAnswer, setCurrentAnswer] = useState('');

  const currentQuestion = ICP_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / ICP_QUESTIONS.length) * 100;
  const isLastQuestion = currentStep === ICP_QUESTIONS.length - 1;

  // Load saved answer when changing steps
  React.useEffect(() => {
    setCurrentAnswer(answers[currentQuestion.id] || '');
  }, [currentStep]);

  const handleNext = () => {
    // Save current answer
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: currentAnswer,
    }));

    if (isLastQuestion) {
      // Complete onboarding
      handleComplete();
    } else {
      // Go to next question
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    // Save current answer before going back
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: currentAnswer,
    }));
    setCurrentStep(prev => prev - 1);
  };

  const handleComplete = () => {
    // Save all answers
    const finalAnswers = {
      ...answers,
      [currentQuestion.id]: currentAnswer,
    };
    
    console.log('ICP Onboarding Complete:', finalAnswers);
    
    // TODO: Send to backend API
    // await saveICPProfile(finalAnswers);
    
    // Navigate to tabs dashboard (UPDATED)
    router.replace('/(tabs)/dashboard');
  };

  const canProceed = currentAnswer.trim().length > 0 || !currentQuestion.required;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0a192f" />

      {/* Header with Progress */}
      <View style={styles.header}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Question {currentStep + 1} of {ICP_QUESTIONS.length}
          </Text>
        </View>

        {/* Back Button (only show if not first question) */}
        {currentStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Question Card */}
        <View style={styles.questionCard}>
          {/* Question Number Badge */}
          <View style={styles.questionBadge}>
            <Text style={styles.questionBadgeText}>Q{currentQuestion.id}</Text>
          </View>

          {/* Question Text */}
          <Text style={styles.questionText}>
            {currentQuestion.question}
          </Text>

          {/* Required indicator */}
          {currentQuestion.required && (
            <Text style={styles.requiredText}>* Required</Text>
          )}

          {/* Answer Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                currentQuestion.multiline && styles.inputMultiline,
              ]}
              placeholder={currentQuestion.placeholder}
              placeholderTextColor="#999"
              value={currentAnswer}
              onChangeText={setCurrentAnswer}
              multiline={currentQuestion.multiline}
              numberOfLines={currentQuestion.multiline ? 5 : 1}
              textAlignVertical={currentQuestion.multiline ? 'top' : 'center'}
            />
          </View>

          {/* Character count for multiline */}
          {currentQuestion.multiline && currentAnswer.length > 0 && (
            <Text style={styles.characterCount}>
              {currentAnswer.length} characters
            </Text>
          )}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tip</Text>
          <Text style={styles.tipsText}>
            {getTipForQuestion(currentQuestion.id)}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        {/* Skip button (only for optional questions) */}
        {!currentQuestion.required && (
          <TouchableOpacity style={styles.skipButton} onPress={handleNext}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}

        {/* Next/Complete Button */}
        <TouchableOpacity
          style={[
            styles.nextButton,
            !canProceed && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!canProceed}
        >
          <Text style={styles.nextButtonText}>
            {isLastQuestion ? 'Complete Setup' : 'Next'}
          </Text>
          {!isLastQuestion && <Text style={styles.nextButtonArrow}> →</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Helper function to provide contextual tips
function getTipForQuestion(questionId: number): string {
  const tips: { [key: number]: string } = {
    1: "Be specific! Instead of 'coach', say 'mindset coach for entrepreneurs' or 'fitness coach for new moms'.",
    2: "Think of an actual person you'd love to work with. What do they do? What stage are they at?",
    3: "What keeps them up at 3am? What frustration makes them say 'there has to be a better way'?",
    4: "Be vivid and specific. How will their day-to-day change? What will they finally be able to do?",
    5: "Authenticity wins. Share a genuine struggle or breakthrough that shaped your expertise.",
    6: "Include age range, gender, location, income level, or profession if relevant.",
    7: "Optional but powerful: psychographics, values, where they hang out online, what they read.",
  };
  return tips[questionId] || "Take your time and be as specific as possible.";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a192f', // Brand blue
  },
  
  // Header
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.2)', // Gold with transparency
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#d4af37', // Brand gold
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backArrow: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
  },

  // Content
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },

  // Question Card
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  questionBadge: {
    backgroundColor: '#d4af37', // Brand gold
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  questionBadgeText: {
    color: '#0a192f', // Brand blue
    fontSize: 12,
    fontWeight: '800',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0a192f', // Brand blue
    lineHeight: 28,
    marginBottom: 8,
  },
  requiredText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginBottom: 20,
    fontWeight: '600',
  },

  // Input
  inputContainer: {
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333',
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  inputMultiline: {
    minHeight: 120,
    paddingTop: 14,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    textAlign: 'right',
  },

  // Tips Card
  tipsCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)', // Gold tint
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#d4af37', // Brand gold
    marginBottom: 6,
  },
  tipsText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 19,
  },

  // Bottom Actions
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0a192f',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#d4af37', // Brand gold
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
  },
  nextButtonText: {
    color: '#0a192f', // Brand blue
    fontSize: 16,
    fontWeight: '700',
  },
  nextButtonArrow: {
    color: '#0a192f',
    fontSize: 18,
    fontWeight: '600',
  },
});