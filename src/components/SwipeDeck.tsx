import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors, fonts } from '@/theme';

const useNative = Platform.OS !== 'web';

/**
 * Tinder-style card stack. Drag right (or tap the heart) to like, left (or X) to pass.
 */
export function SwipeDeck<T extends { id: string }>({
  items,
  renderCard,
  onSwipe,
  empty,
  likeLabel = 'CRAVE IT',
}: {
  items: T[];
  renderCard: (item: T) => ReactNode;
  onSwipe: (item: T, liked: boolean) => void;
  empty: ReactNode;
  likeLabel?: string;
}) {
  const { width } = useWindowDimensions();
  const threshold = Math.min(width * 0.28, 140);
  const [index, setIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;
  const busy = useRef(false);

  // Reset when the list is replaced (filters changed, refresh).
  useEffect(() => {
    setIndex(0);
    position.setValue({ x: 0, y: 0 });
  }, [items, position]);

  const current = items[index];
  const next = items[index + 1];

  const finish = (liked: boolean) => {
    const item = items[index];
    if (!item || busy.current) return;
    busy.current = true;
    if (Platform.OS !== 'web') Haptics.impactAsync(liked ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.timing(position, {
      toValue: { x: (liked ? 1 : -1) * width * 1.4, y: 40 },
      duration: 240,
      useNativeDriver: useNative,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setIndex((i) => i + 1);
      busy.current = false;
      onSwipe(item, liked);
    });
  };

  const finishRef = useRef(finish);
  finishRef.current = finish;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], { useNativeDriver: false }),
        onPanResponderRelease: (_e, g) => {
          if (g.dx > threshold) finishRef.current(true);
          else if (g.dx < -threshold) finishRef.current(false);
          else Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: useNative }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: useNative }).start();
        },
      }),
    [position, threshold],
  );

  if (!current) return <>{empty}</>;

  const rotate = position.x.interpolate({ inputRange: [-width, 0, width], outputRange: ['-12deg', '0deg', '12deg'] });
  const likeOpacity = position.x.interpolate({ inputRange: [0, threshold], outputRange: [0, 1], extrapolate: 'clamp' });
  const nopeOpacity = position.x.interpolate({ inputRange: [-threshold, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const nextScale = position.x.interpolate({ inputRange: [-width, 0, width], outputRange: [1, 0.94, 1], extrapolate: 'clamp' });

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, marginHorizontal: 16 }}>
        {next && (
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: nextScale }] }]} pointerEvents="none">
            {renderCard(next)}
          </Animated.View>
        )}
        <Animated.View
          key={current.id}
          {...responder.panHandlers}
          style={[StyleSheet.absoluteFill, { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] }]}
        >
          {renderCard(current)}
          <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]} pointerEvents="none">
            <Text style={[styles.stampText, { color: colors.teal }]}>{likeLabel}</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.nopeStamp, { opacity: nopeOpacity }]} pointerEvents="none">
            <Text style={[styles.stampText, { color: colors.coral }]}>PASS</Text>
          </Animated.View>
        </Animated.View>
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityLabel="Pass" onPress={() => finish(false)} style={[styles.round, { borderColor: colors.coral }]}>
          <Ionicons name="close" size={34} color={colors.coral} />
        </Pressable>
        <Pressable accessibilityLabel="Like" onPress={() => finish(true)} style={[styles.round, styles.roundBig, { backgroundColor: colors.violet, borderColor: colors.violet }]}>
          <Ionicons name="heart" size={38} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 28, paddingVertical: 16 },
  round: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.violetDeep,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  roundBig: { width: 76, height: 76, borderRadius: 38 },
  stamp: { position: 'absolute', top: 40, borderWidth: 4, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#ffffffdd' },
  likeStamp: { left: 24, borderColor: colors.teal, transform: [{ rotate: '-14deg' }] },
  nopeStamp: { right: 24, borderColor: colors.coral, transform: [{ rotate: '14deg' }] },
  stampText: { fontFamily: fonts.logo, fontSize: 30 },
});
