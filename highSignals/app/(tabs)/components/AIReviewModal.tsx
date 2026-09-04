import React, { useState, useEffect } from 'react'
import { View, Text, Modal, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, PanResponder, Animated as RNAnimated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '@/context/ThemeContext'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import Toast from 'react-native-toast-message'

interface AIReviewModalProps {
  visible: boolean
  onClose: () => void
  postId: string
  content: string
  title?: string
  contentType?: string
  icpProfile?: string
  onInsert: (revampedText: string) => void
}

const SkeletonLine = ({ width = '100%', height = 20, style }: any) => {
  const { colors } = useTheme()
  const opacity = React.useRef(new RNAnimated.Value(0.3)).current

  React.useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        RNAnimated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  return <RNAnimated.View style={[{ width, height, backgroundColor: colors.border || '#E5E7EB', borderRadius: 8, marginVertical: 6, opacity }, style]} />
}

export default function AIReviewModal({ visible, onClose, postId, content, title, contentType, icpProfile, onInsert }: AIReviewModalProps) {
  const { colors } = useTheme()
  const { user, refreshUserData } = useAuth()
  const styles = React.useMemo(() => getStyles(colors), [colors])

  const [mode, setMode] = useState<'analyze' | 'revamp'>('analyze')
  const [loading, setLoading] = useState(true)
  const [score, setScore] = useState<number | null>(null)
  const [insights, setInsights] = useState<string[]>([])
  const [revampedText, setRevampedText] = useState('')

  const panResponder = React.useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) onClose()
      },
    }),
    [onClose]
  )

  useEffect(() => {
    if (visible && mode === 'analyze') analyzePost()
  }, [visible])

  const analyzePost = async () => {
    setLoading(true)
    try {
      const response = await api.call(`/api/ai/analyze/${postId}`, { method: 'POST', body: JSON.stringify({ content, title, contentType, icpProfile }) })
      setScore(response.score)
      setInsights(response.insights)
    } catch (err) {
      console.error(err)
      Toast.show({ type: 'error', text1: 'AI Analysis Failed' })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleRevamp = async () => {
    setMode('revamp')
    setLoading(true)
    try {
      const response = await api.call(`/api/ai/revamp/${postId}`, { method: 'POST', body: JSON.stringify({ content, title, contentType, icpProfile }) })
      setRevampedText(response.revampedContent)
      if (refreshUserData) await refreshUserData()
    } catch (err: any) {
      console.error(err)
      const msg = err.message || 'Revamp Failed'
      Toast.show({ type: 'error', text1: msg })
      setMode('analyze')
    } finally {
      setLoading(false)
    }
  }

  const handleInsert = () => {
    if (revampedText) {
      onInsert(revampedText)
      onClose()
    }
  }

  const aiUsage = user?.aiUsage ?? 0

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View {...panResponder.panHandlers} style={styles.headerArea}>
            <View style={styles.dragHandle} />
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingTitle}>{mode === 'analyze' ? 'AI is reviewing your script...' : 'Revamping script...'}</Text>
              <View style={styles.skeletonWrapper}>
                <SkeletonLine width="60%" height={24} style={{ alignSelf: 'center', marginBottom: 20 }} />
                <SkeletonLine width="100%" height={16} />
                <SkeletonLine width="90%" height={16} />
                <SkeletonLine width="95%" height={16} />
                <View style={{ marginTop: 24 }}>
                  <SkeletonLine width="100%" height={16} />
                  <SkeletonLine width="85%" height={16} />
                </View>
              </View>
            </View>
          ) : mode === 'analyze' ? (
            <View style={styles.analyzeContainer}>
              <Text style={styles.title}>AI Feedback</Text>
              <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
                {score !== null && (
                  <View style={[styles.scoreContainer, { borderColor: score > 75 ? '#10B981' : score > 50 ? '#F59E0B' : '#EF4444' }]}>
                    <Text style={[styles.scoreValue, { color: score > 75 ? '#10B981' : score > 50 ? '#F59E0B' : '#EF4444' }]}>{score}</Text>
                    <Text style={styles.scoreLabel}>/100</Text>
                  </View>
                )}
                <View style={styles.insightsList}>
                  {insights.map((insight, idx) => (
                    <View key={idx} style={styles.insightItem}>
                      <Ionicons name="bulb-outline" size={20} color={colors.gold || '#F59E0B'} style={styles.insightIcon} />
                      <Text style={styles.insightText}>{insight}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
              <View style={styles.actionArea}>
                <Text style={styles.usageText}>{aiUsage} /10 Daily Trials Remaining</Text>
                <TouchableOpacity
                  style={[styles.primaryBtn, aiUsage <= 0 && styles.disabledBtn]}
                  onPress={handleRevamp}
                  disabled={aiUsage <= 0}
                >
                  <Ionicons name="sparkles" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Generate Upgraded Version</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.revampContainer}>
              <Text style={styles.title}>Revamped Script</Text>
              <ScrollView style={styles.previewScroll}>
                <Text style={styles.previewText}>{revampedText}</Text>
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setMode('analyze')}>
                  <Text style={styles.cancelText}>Discard</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={handleInsert}>
                  <Text style={styles.confirmText}>Insert</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

const getStyles = (colors: any) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.navyMuted || 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surfaceLight || '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40, minHeight: 550, maxHeight: '90%', height: '85%' },
  headerArea: { alignItems: 'center', paddingVertical: 12 },
  dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border || '#ccc', marginBottom: 8 },
  closeBtn: { position: 'absolute', right: 0, top: 12 },
  loadingContainer: { flex: 1, paddingVertical: 20 },
  loadingTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 30 },
  skeletonWrapper: { width: '100%', paddingHorizontal: 10 },
  analyzeContainer: { flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 20 },
  scoreContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 28, alignSelf: 'center', width: 140, height: 140, borderRadius: 70, backgroundColor: colors.surfaceCard || '#fafafa', borderWidth: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  scoreValue: { fontSize: 52, fontWeight: '900' },
  scoreLabel: { fontSize: 16, fontWeight: '700', color: colors.textMuted || '#888', marginLeft: 2, marginTop: 12 },
  insightsList: { gap: 16, marginBottom: 32 },
  insightItem: { flexDirection: 'row', backgroundColor: colors.surfaceCard || '#fafafa', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border || '#eee' },
  insightIcon: { marginRight: 12, marginTop: 2 },
  insightText: { flex: 1, color: colors.text, fontSize: 15, lineHeight: 22 },
  actionArea: { marginTop: 'auto', alignItems: 'center' },
  usageText: { color: colors.textMuted || '#888', fontSize: 13, fontWeight: '600', marginBottom: 12 },
  primaryBtn: { width: '100%', backgroundColor: colors.primaryAction || '#4F46E5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, gap: 8 },
  disabledBtn: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  revampContainer: { flex: 1 },
  previewScroll: { flex: 1, backgroundColor: colors.surfaceCard || '#fafafa', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border || '#eee', marginBottom: 20, maxHeight: 400 },
  previewText: { color: colors.text, fontSize: 15, lineHeight: 24 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.surfaceCard || '#fafafa', borderWidth: 1, borderColor: colors.border || '#eee' },
  cancelText: { color: colors.text, fontWeight: '700', fontSize: 16 },
  confirmButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.navyLight || '#4F46E5' },
  confirmText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
