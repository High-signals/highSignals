import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';

type UserType = 'business' | 'creator' | null;

// Business Owner Questions (existing 7)
const businessQuestions = [
  {
    id: 'profession',
    question: 'What do you do? (one sentence)',
    placeholder: 'e.g., "I help small businesses grow their revenue"',
  },
  {
    id: 'dreamClient',
    question: 'Describe your dream client',
    placeholder: 'e.g., "Small business owners with 5-10 employees"',
  },
  {
    id: 'problem',
    question: 'What is the #1 problem you solve for them?',
    placeholder: 'e.g., "They struggle to get consistent leads"',
  },
  {
    id: 'outcome',
    question: 'What is their dream outcome after you solve this problem?',
    placeholder: 'e.g., "Predictable revenue every month"',
  },
  {
    id: 'story',
    question: 'What is your personal story or expertise in this area?',
    placeholder: 'e.g., "I built 3 businesses from scratch"',
  },
  {
    id: 'demographics',
    question: 'Demographics of your dream client',
    placeholder: 'e.g., "30-45 year old entrepreneurs in tech"',
  },
  {
    id: 'additional',
    question: 'Anything else about your audience? (optional)',
    placeholder: 'Any additional details...',
    optional: true,
  },
];

// Content Creator Questions (new 6)
const creatorQuestions = [
  {
    id: 'topic',
    question: 'What is the main topic you post about?',
    placeholder: 'e.g., "Quick healthy recipes", "Tech tips for beginners"',
  },
  {
    id: 'dreamFollower',
    question: 'Who is your dream follower?',
    placeholder: 'e.g., "College students trying to get a job"',
  },
  {
    id: 'followReason',
    question: 'What is the main reason people follow you?',
    type: 'select',
    options: [
      'To learn something new',
      'To be entertained',
      'To feel inspired',
      'Because my life is relatable',
    ],
  },
  {
    id: 'feeling',
    question: 'How do you want people to feel after seeing your post?',
    placeholder: 'e.g., "Motivated to start a project"',
  },
  {
    id: 'backstory',
    question: 'What is your unique backstory or journey?',
    placeholder: 'e.g., "I quit my 9-to-5 to build an app"',
  },
  {
    id: 'goal',
    question: 'What is your ultimate goal for growing this audience?',
    type: 'select',
    options: ['To get brand deals', 'Just to build a community'],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');

  const questions = userType === 'business' ? businessQuestions : creatorQuestions;
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
  };

  const handleNext = () => {
    // Save current answer
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: currentAnswer,
    };
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
    } else {
      handleComplete(newAnswers);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setCurrentAnswer(answers[questions[currentQuestionIndex - 1].id] || '');
    } else {
      setUserType(null);
    }
  };

  const handleSkip = () => {
    if (currentQuestion.optional) {
      handleNext();
    }
  };

  const handleComplete = (finalAnswers: Record<string, string>) => {
    console.log('Onboarding Complete:', { userType, answers: finalAnswers });
    // TODO: Send to backend
    router.replace('/tabs/dashboard');
  };

  // User Type Selection Screen
  if (!userType) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.typeSelectionContent}>
          <Text style={styles.mainTitle}>Which defines your goal of creating content?</Text>

          <TouchableOpacity
            style={styles.typeCard}
            onPress={() => handleUserTypeSelect('business')}
          >
            <View style={styles.typeIcon}>
              <Text style={styles.typeEmoji}>💼</Text>
            </View>
            <View style={styles.typeContent}>
              <Text style={styles.typeTitle}>Business owner/entrepreneur</Text>
              <Text style={styles.typeDescription}>I sell a product or service</Text>
            </View>
            <Text style={styles.typeArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.typeCard}
            onPress={() => handleUserTypeSelect('creator')}
          >
            <View style={styles.typeIcon}>
              <Text style={styles.typeEmoji}>🎨</Text>
            </View>
            <View style={styles.typeContent}>
              <Text style={styles.typeTitle}>Content creator</Text>
              <Text style={styles.typeDescription}>I build an audience and community</Text>
            </View>
            <Text style={styles.typeArrow}>→</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Question Screen
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {currentQuestionIndex + 1}/{questions.length}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Question */}
        <Text style={styles.question}>{currentQuestion.question}</Text>

        {/* Input or Select */}
        {currentQuestion.type === 'select' ? (
          <View style={styles.optionsContainer}>
            {currentQuestion.options?.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  currentAnswer === option && styles.optionButtonSelected,
                ]}
                onPress={() => setCurrentAnswer(option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    currentAnswer === option && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
                {currentAnswer === option && (
                  <Text style={styles.optionCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <TextInput
            style={styles.textInput}
            placeholder={currentQuestion.placeholder}
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={currentAnswer}
            onChangeText={setCurrentAnswer}
            multiline
            textAlignVertical="top"
          />
        )}

        {/* Helper Text */}
        {currentQuestion.optional && (
          <Text style={styles.helperText}>This question is optional</Text>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {currentQuestion.optional && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.nextButton,
            !currentAnswer && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!currentAnswer}
        >
          <Text style={styles.nextButtonText}>
            {currentQuestionIndex === questions.length - 1 ? 'Complete Setup' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1628',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '600',
  },
  progressContainer: {
    flex: 1,
    marginLeft: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00D9FF',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D9FF',
  },

  // Type Selection
  typeSelectionContent: {
    padding: 24,
    paddingTop: 40,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 40,
    lineHeight: 36,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  typeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,217,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  typeEmoji: {
    fontSize: 24,
  },
  typeContent: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  typeArrow: {
    fontSize: 24,
    color: '#00D9FF',
    fontWeight: '600',
  },

  // Question Screen
  content: {
    padding: 24,
    flex: 1,
  },
  question: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 30,
    lineHeight: 32,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    color: '#ffffff',
    minHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  helperText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 12,
  },

  // Options
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: 'rgba(0,217,255,0.1)',
    borderColor: '#00D9FF',
  },
  optionText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
  optionCheck: {
    fontSize: 18,
    color: '#00D9FF',
    fontWeight: '800',
  },

  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  skipButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#00D9FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(0,217,255,0.3)',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});