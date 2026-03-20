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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

type PublishOption = 'immediate' | 'schedule' | 'draft';

export default function CreatePostScreen() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('LinkedIn');
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Publishing options
  const [publishOption, setPublishOption] = useState<PublishOption>('immediate');
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  
  // Text formatting
  const [fontSize, setFontSize] = useState(16);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

  const platforms = ['LinkedIn', 'Twitter', 'Instagram', 'Facebook', 'Blog'];

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    
    // TODO: Call AI API
    setTimeout(() => {
      setAiScore(92);
      setAiFeedback([
        'Strong opening hook that grabs attention',
        'Consider adding a call-to-action at the end',
        'Good use of storytelling elements',
      ]);
      setIsAnalyzing(false);
    }, 2000);
  };

  const handlePublish = () => {
    if (publishOption === 'immediate') {
      console.log('Publishing immediately:', { title, content, platform });
      router.back();
    } else if (publishOption === 'schedule') {
      console.log('Scheduling for:', scheduleDate, { title, content, platform });
      router.back();
    } else {
      console.log('Saving as draft:', { title, content, platform });
      router.back();
    }
  };

  const increaseFontSize = () => {
    if (fontSize < 24) setFontSize(fontSize + 2);
  };

  const decreaseFontSize = () => {
    if (fontSize > 12) setFontSize(fontSize - 2);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Content</Text>
        <TouchableOpacity onPress={() => console.log('Save draft')}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Platform Selector */}
        <View style={styles.platformSection}>
          <Text style={styles.sectionLabel}>Platform</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {platforms.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.platformChip, platform === p && styles.platformChipActive]}
                onPress={() => setPlatform(p)}
              >
                <Text style={[styles.platformText, platform === p && styles.platformTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <TextInput
            style={styles.titleInput}
            placeholder="Title (optional)"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Formatting Toolbar */}
        <View style={styles.toolbar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.toolbarGroup}>
              <TouchableOpacity style={styles.toolButton} onPress={decreaseFontSize}>
                <Text style={styles.toolIcon}>A-</Text>
              </TouchableOpacity>
              <Text style={styles.fontSizeDisplay}>{fontSize}</Text>
              <TouchableOpacity style={styles.toolButton} onPress={increaseFontSize}>
                <Text style={styles.toolIcon}>A+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.toolButton, isBold && styles.toolButtonActive]}
              onPress={() => setIsBold(!isBold)}
            >
              <Text style={[styles.toolIcon, { fontWeight: 'bold' }]}>B</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.toolButton, isItalic && styles.toolButtonActive]}
              onPress={() => setIsItalic(!isItalic)}
            >
              <Text style={[styles.toolIcon, { fontStyle: 'italic' }]}>I</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Content Editor */}
        <View style={styles.editorSection}>
          <TextInput
            style={[
              styles.contentInput,
              { 
                fontSize,
                fontWeight: isBold ? 'bold' : 'normal',
                fontStyle: isItalic ? 'italic' : 'normal',
              }
            ]}
            placeholder="Write your content here..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Character Count */}
        <View style={styles.stats}>
          <Text style={styles.statText}>
            {content.length} characters · {content.split(' ').filter(Boolean).length} words
          </Text>
        </View>

        {/* AI Score */}
        {aiScore !== null && (
          <View style={styles.aiResultCard}>
            <View style={styles.scoreSection}>
              <View style={styles.scoreCircleLarge}>
                <Text style={styles.scoreLabel}>AI SCORE</Text>
                <Text style={styles.scoreLarge}>{aiScore}</Text>
                <Text style={styles.scoreOutOf}>/100</Text>
              </View>
            </View>

            <View style={styles.feedbackSection}>
              <Text style={styles.feedbackTitle}>💡 AI Suggestions</Text>
              {aiFeedback.map((feedback, index) => (
                <View key={index} style={styles.feedbackItem}>
                  <Text style={styles.feedbackBullet}>•</Text>
                  <Text style={styles.feedbackText}>{feedback}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 180 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {aiScore === null ? (
          <TouchableOpacity 
            style={[styles.analyzeButton, (!content || isAnalyzing) && styles.buttonDisabled]}
            onPress={handleAnalyze}
            disabled={!content || isAnalyzing}
          >
            <Text style={styles.analyzeButtonText}>
              {isAnalyzing ? 'Analyzing...' : '🤖 Get AI Feedback'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.publishOptionsButton}
            onPress={() => setShowPublishModal(true)}
          >
            <Text style={styles.publishOptionsText}>Choose Publish Option →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Publish Options Modal */}
      <Modal
        visible={showPublishModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPublishModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Publish Options</Text>

            {/* Immediate */}
            <TouchableOpacity
              style={[styles.option, publishOption === 'immediate' && styles.optionSelected]}
              onPress={() => setPublishOption('immediate')}
            >
              <View style={styles.optionLeft}>
                <Text style={styles.optionIcon}>⚡</Text>
                <View>
                  <Text style={styles.optionTitle}>Publish Immediately</Text>
                  <Text style={styles.optionDesc}>Post will go live right now</Text>
                </View>
              </View>
              {publishOption === 'immediate' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            {/* Schedule */}
            <TouchableOpacity
              style={[styles.option, publishOption === 'schedule' && styles.optionSelected]}
              onPress={() => {
                setPublishOption('schedule');
                setShowDatePicker(true);
              }}
            >
              <View style={styles.optionLeft}>
                <Text style={styles.optionIcon}>📅</Text>
                <View>
                  <Text style={styles.optionTitle}>Schedule for Later</Text>
                  <Text style={styles.optionDesc}>
                    {publishOption === 'schedule' 
                      ? scheduleDate.toLocaleString()
                      : 'Choose date and time'}
                  </Text>
                </View>
              </View>
              {publishOption === 'schedule' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            {/* Draft */}
            <TouchableOpacity
              style={[styles.option, publishOption === 'draft' && styles.optionSelected]}
              onPress={() => setPublishOption('draft')}
            >
              <View style={styles.optionLeft}>
                <Text style={styles.optionIcon}>📝</Text>
                <View>
                  <Text style={styles.optionTitle}>Save as Draft</Text>
                  <Text style={styles.optionDesc}>Come back to it later</Text>
                </View>
              </View>
              {publishOption === 'draft' && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowPublishModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  setShowPublishModal(false);
                  handlePublish();
                }}
              >
                <Text style={styles.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={scheduleDate}
          mode="datetime"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setScheduleDate(selectedDate);
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a192f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  closeButton: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '700',
    color: '#d4af37',
  },

  // Platform
  platformSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
    letterSpacing: 1,
  },
  platformChip: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  platformChipActive: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37',
  },
  platformText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  platformTextActive: {
    color: '#0a192f',
  },

  // Title
  titleSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    paddingVertical: 12,
  },

  // Toolbar
  toolbar: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  toolbarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  toolButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  toolButtonActive: {
    backgroundColor: '#d4af37',
  },
  toolIcon: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  fontSizeDisplay: {
    fontSize: 14,
    color: '#d4af37',
    fontWeight: '600',
    marginHorizontal: 4,
  },

  // Editor
  editorSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    minHeight: 300,
  },
  contentInput: {
    color: '#ffffff',
    lineHeight: 28,
  },

  // Stats
  stats: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  statText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },

  // AI Results
  aiResultCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 24,
    marginTop: 16,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  scoreCircleLarge: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 8,
  },
  scoreLarge: {
    fontSize: 64,
    fontWeight: '800',
    color: '#0a192f',
    lineHeight: 72,
  },
  scoreOutOf: {
    fontSize: 18,
    fontWeight: '600',
    color: '#d4af37',
  },
  feedbackSection: {},
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a192f',
    marginBottom: 16,
  },
  feedbackItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  feedbackBullet: {
    fontSize: 16,
    color: '#d4af37',
    marginRight: 8,
    fontWeight: '800',
  },
  feedbackText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    flex: 1,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0a192f',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  analyzeButton: {
    backgroundColor: '#d4af37',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: '#0a192f',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(212,175,55,0.3)',
  },
  publishOptionsButton: {
    backgroundColor: '#d4af37',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  publishOptionsText: {
    color: '#0a192f',
    fontSize: 16,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0a192f',
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: '#d4af37',
    backgroundColor: 'rgba(212,175,55,0.1)',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a192f',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 13,
    color: '#666',
  },
  checkmark: {
    fontSize: 20,
    color: '#d4af37',
    fontWeight: '800',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#d4af37',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a192f',
  },
});