import React, { useEffect, useState } from 'react';
import {
    Alert,
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
    ChevronRight,
    CircleCheckBig,
    CircleX,
    Clock3,
    Trophy,
    Medal,
    HelpCircle,
    RotateCcw,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useGameStore } from '@/stores/gameStore';
import { useWalletStore } from '@/stores/walletStore';
import { GameWasteGroup } from '@/types';

const fallbackOptions: { value: GameWasteGroup; label: string; hint: string; accent: string }[] = [
    { value: 'recyclable', label: 'Tái chế được', hint: 'Nhựa, giấy, kim loại sạch', accent: '#2E7D32' },
    { value: 'hazardous', label: 'Nguy hại', hint: 'Pin, bóng đèn, hóa chất', accent: '#7B1FA2' },
    { value: 'organic', label: 'Hữu cơ', hint: 'Thức ăn thừa, lá cây', accent: '#EF6C00' },
    { value: 'non-recyclable', label: 'Còn lại', hint: 'Khăn giấy bẩn, rác lẫn tạp', accent: '#455A64' },
];

export default function QuizScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const submitAnswer = useGameStore((state) => state.submitAnswer);
    const nextQuestion = useGameStore((state) => state.nextQuestion);
    const resetDailyPlaysForDev = useGameStore((state) => state.resetDailyPlaysForDev);
    const dailyPlaysUsed = useGameStore((state) => state.dailyPlaysUsed);
    const dailyPlaysLimit = useGameStore((state) => state.dailyPlaysLimit);
    const currentQuestion = useGameStore((state) => state.currentQuestion);
    const addGreenPoints = useWalletStore((state) => state.addGreenPoints);

    const [selectedAnswer, setSelectedAnswer] = useState<GameWasteGroup | null>(null);
    const [feedback, setFeedback] = useState<{ correct: boolean; pointsEarned: number; explanation: string } | null>(null);
    const [feedbackVisible, setFeedbackVisible] = useState(false);

    const playsLeft = Math.max(dailyPlaysLimit - dailyPlaysUsed, 0);
    const currentQuestionNumber = Math.min(dailyPlaysUsed + 1, dailyPlaysLimit);
    const questionOptions = currentQuestion?.options ?? fallbackOptions;
    const canPlay = playsLeft > 0 && Boolean(currentQuestion);

    const handleAnswer = (value: GameWasteGroup) => {
        if (!currentQuestion || !canPlay || feedback) return;

        setSelectedAnswer(value);
        const result = submitAnswer(value);
        if (!result) return;

        setFeedback(result);
        setFeedbackVisible(true);
        addGreenPoints(result.pointsEarned, `Điểm từ game: ${currentQuestion.wasteName}`);
    };

    const handleNextQuestion = () => {
        setSelectedAnswer(null);
        setFeedback(null);
        setFeedbackVisible(false);
        nextQuestion();
    };

    const handleViewRewards = () => {
        router.push('/rewards' as any);
    };

    const handleDevReset = () => {
        Alert.alert('Reset lượt chơi', 'Bạn có muốn reset lượt chơi hôm nay không?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Reset',
                style: 'destructive',
                onPress: () => {
                    resetDailyPlaysForDev();
                    setSelectedAnswer(null);
                    setFeedback(null);
                    setFeedbackVisible(false);
                },
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
            >
                {/* Header điều hướng nhanh */}
                <View style={styles.topNav}>
                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={() => router.push('/game/progress' as any)}
                    >
                        <LinearGradient colors={['#FFF', '#F8FBF9']} style={styles.navGradient}>
                            <Medal size={20} color={Colors.primaryDark} />
                            <Text style={styles.navText}>Huy hiệu</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={[styles.navButton, styles.statusInfo]}>
                        <Clock3 size={16} color={Colors.primaryDark} />
                        <Text style={styles.statusText}>{playsLeft} lượt còn lại</Text>
                    </View>
                </View>

                {__DEV__ ? (
                    <TouchableOpacity style={styles.devResetButton} onPress={handleDevReset} activeOpacity={0.85}>
                        <RotateCcw size={14} color={Colors.white} />
                        <Text style={styles.devResetButtonText}>Reset lượt chơi (DEV)</Text>
                    </TouchableOpacity>
                ) : null}

                {currentQuestion ? (
                    <View style={styles.mainCard}>
                        {/* Ảnh minh họa và Tag tên vật dụng */}
                        <View style={styles.imageContainer}>
                            <Image source={{ uri: currentQuestion.imageUrl }} style={styles.image} contentFit="cover" />
                            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.overlay} />
                            <View style={styles.badgeNameContainer}>
                                <HelpCircle size={16} color={Colors.white} />
                                <Text style={styles.badgeNameText}>{currentQuestion.wasteName}</Text>
                            </View>
                            <View style={styles.stepCounter}>
                                <Text style={styles.stepText}>{currentQuestionNumber}/{dailyPlaysLimit}</Text>
                            </View>
                        </View>

                        <Text style={styles.questionTitle}>Vật dụng này thuộc nhóm rác nào?</Text>

                        {/* Lưới câu trả lời 2 cột */}
                        <View style={styles.answerGrid}>
                            {questionOptions.map((option) => {
                                const isSelected = selectedAnswer === option.value;
                                const isCorrect = feedback?.correct && isSelected;
                                const isWrong = feedback && !feedback.correct && isSelected;
                                const accentColor = fallbackOptions.find((item) => item.value === option.value)?.accent ?? Colors.primaryDark;

                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.optionCard,
                                            isSelected && { backgroundColor: accentColor, borderColor: accentColor },
                                            isWrong && { backgroundColor: '#FFEBEE', borderColor: '#EF5350' }
                                        ]}
                                        onPress={() => handleAnswer(option.value)}
                                        disabled={!!feedback}
                                    >
                                        <Text style={[styles.optionLabel, isSelected && { color: '#FFF' }, isWrong && { color: '#C62828' }]}>
                                            {option.label}
                                        </Text>
                                        {!isSelected && <Text style={styles.optionHint}>{option.hint}</Text>}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Feedback mượt mà */}
                        {feedbackVisible && feedback && ( // Thêm && feedback ở đây
                            <View style={[styles.feedbackBox, feedback.correct ? styles.boxCorrect : styles.boxWrong]}>
                                <View style={styles.feedbackHeader}>
                                    {feedback.correct ? (
                                        <CircleCheckBig size={20} color="#2E7D32" />
                                    ) : (
                                        <CircleX size={20} color="#C62828" />
                                    )}
                                    <Text style={[styles.feedbackTitle, { color: feedback.correct ? '#2E7D32' : '#C62828' }]}>
                                        {feedback.correct ? 'Rất chính xác!' : 'Tiếc quá...'}
                                    </Text>
                                </View>

                                <Text style={styles.feedbackDesc}>{feedback.explanation}</Text>

                                <TouchableOpacity
                                    style={[
                                        styles.actionButton,
                                        { backgroundColor: feedback.correct ? '#2E7D32' : '#455A64' }
                                    ]}
                                    onPress={() => {
                                        setFeedback(null);
                                        setFeedbackVisible(false);
                                        setSelectedAnswer(null);
                                        nextQuestion();
                                    }}
                                >
                                    <Text style={styles.actionButtonText}>Tiếp tục</Text>
                                    <ChevronRight size={20} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.emptyCard}>
                        <Trophy size={60} color="#FFD600" />
                        <Text style={styles.emptyTitle}>Hoàn thành thử thách!</Text>
                        <Text style={styles.emptyDesc}>Bạn đã hết lượt chơi hôm nay. Hãy quay lại vào ngày mai nhé!</Text>
                        <TouchableOpacity style={styles.rewardBtn} onPress={() => router.push('/rewards' as any)}>
                            <Text style={styles.rewardBtnText}>Đổi thưởng ngay</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EAF6F0',
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 14,
    },
    sectionCard: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        padding: 16,
        shadowColor: '#1C513A',
        shadowOpacity: 0.07,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    sectionTitle: {
        color: Colors.text,
        fontSize: 18,
        fontWeight: '900',
    },
    sectionCaption: {
        color: Colors.textSecondary,
        fontSize: 12,
        marginTop: 4,
    },
    limitBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.sand,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 999,
    },
    limitBadgeText: {
        color: Colors.primaryDark,
        fontSize: 12,
        fontWeight: '800',
    },
    questionImageWrap: {
        borderRadius: 22,
        overflow: 'hidden',
        aspectRatio: 1.35,
    },
    questionImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    questionTag: {
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: 14,
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    questionTagText: {
        color: Colors.primaryDark,
        fontSize: 15,
        fontWeight: '800',
    },
    answerCard: {
        borderWidth: 1.5,
        borderRadius: 18,
        padding: 14,
        backgroundColor: '#F8FBF9',
    },
    answerCardDisabled: {
        opacity: 0.75,
    },
    answerTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.text,
    },
    answerTitleSelected: {
        color: Colors.white,
    },
    answerHint: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 4,
        lineHeight: 18,
    },
    answerHintSelected: {
        color: 'rgba(255,255,255,0.88)',
    },
    feedbackCard: {
        marginTop: 14,
        borderRadius: 20,
        padding: 16,
        gap: 8,
    },
    feedbackCorrect: {
        backgroundColor: '#E8F5E9',
    },
    feedbackWrong: {
        backgroundColor: '#FFEBEE',
    },
    feedbackRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    feedbackText: {
        color: Colors.textSecondary,
        fontSize: 13,
        lineHeight: 19,
    },
    feedbackPoints: {
        color: Colors.primaryDark,
        fontSize: 13,
        fontWeight: '800',
    },
    nextButton: {
        marginTop: 8,
        backgroundColor: Colors.primaryDark,
        borderRadius: 16,
        paddingVertical: 13,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    nextButtonText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '800',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
    },
    emptyStateText: {
        color: Colors.textSecondary,
        fontSize: 13,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 19,
    },
    emptyStateButton: {
        marginTop: 14,
        backgroundColor: Colors.primary,
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 18,
    },
    emptyStateButtonText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '800',
    },
    switchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        gap: 10,
    },
    switchButtonText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
    },
    // Header điều hướng
    topNav: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, gap: 10 },
    navButton: { flex: 1, borderRadius: 15, overflow: 'hidden', elevation: 2 },
    navGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
    navText: { fontWeight: '700', color: Colors.text, fontSize: 14 },
    statusInfo: { backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    statusText: { fontWeight: '700', color: Colors.primaryDark, fontSize: 13 },
    devResetButton: {
        marginBottom: 12,
        borderRadius: 12,
        backgroundColor: '#C62828',
        paddingVertical: 10,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    devResetButtonText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: '800',
    },

    // Card chính
    mainCard: { backgroundColor: '#FFF', borderRadius: 28, padding: 15, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    imageContainer: { borderRadius: 22, overflow: 'hidden', height: 220, position: 'relative' },
    image: { width: '100%', height: '100%' },
    overlay: { ...StyleSheet.absoluteFillObject },
    badgeNameContainer: { position: 'absolute', bottom: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    badgeNameText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
    stepCounter: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    stepText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

    // Câu hỏi & Đáp án
    questionTitle: { fontSize: 18, fontWeight: '900', color: Colors.text, marginVertical: 15, textAlign: 'center' },
    answerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    optionCard: { width: '48.5%', backgroundColor: '#F8FBF9', borderWidth: 1.5, borderColor: '#E3ECE7', borderRadius: 18, padding: 12, justifyContent: 'center', alignItems: 'center', height: 80 },
    optionLabel: { fontWeight: '800', color: Colors.text, textAlign: 'center', fontSize: 14 },
    optionHint: { fontSize: 10, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },

    // Feedback
    feedbackBox: { marginTop: 20, borderRadius: 20, padding: 16 },
    boxCorrect: { backgroundColor: '#E8F5E9' },
    boxWrong: { backgroundColor: '#FFEBEE' },
    feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    feedbackTitle: { fontSize: 16, fontWeight: '900' },
    feedbackDesc: { fontSize: 13, color: '#455A64', lineHeight: 18, marginBottom: 15 },
    actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14, gap: 8 },
    actionButtonText: { color: '#FFF', fontWeight: '800' },

    // Trạng thái trống
    emptyCard: { alignItems: 'center', padding: 40, backgroundColor: '#FFF', borderRadius: 28, marginTop: 20 },
    emptyTitle: { fontSize: 20, fontWeight: '900', color: Colors.text, marginTop: 15 },
    emptyDesc: { textAlign: 'center', color: Colors.textSecondary, marginTop: 10, lineHeight: 20 },
    rewardBtn: { marginTop: 20, backgroundColor: Colors.primary, paddingHorizontal: 25, paddingVertical: 12, borderRadius: 15 },
    rewardBtnText: { color: '#FFF', fontWeight: '800' }
});
