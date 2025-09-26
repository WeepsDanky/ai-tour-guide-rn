import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../lib/tokens';
import { CardType } from '../../types/schema';

interface CardData {
  type: CardType;
  title: string;
  content: any;
}

interface LectureCardsProps {
  cards: CardData[];
  onCardPress?: (card: CardData) => void;
}

export function LectureCards({ cards, onCardPress }: LectureCardsProps) {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  
  // 渲染卡片图标
  const renderCardIcon = (type: CardType) => {
    const iconMap: Record<string, any> = {
      what: 'information-circle',
      components: 'construct',
      timeline: 'time',
      people: 'people',
      reading: 'book',
      sources: 'library',
    };
    
    return (
      <Ionicons 
        name={iconMap[type] || 'document'} 
        size={20} 
        color={tokens.colors.accent.architecture} 
      />
    );
  };
  
  // 渲染卡片标题
  const renderCardTitle = (type: CardType) => {
    const titleMap: Record<string, string> = {
      what: 'What / Why / So-what',
      components: '构件标注',
      timeline: '时间线',
      people: '人物关系',
      reading: '延伸阅读',
      sources: '引用来源',
    };
    
    return titleMap[type] || '未知类型';
  };
  
  // 渲染What/Why/So-what卡片内容
  const renderWhatCard = (content: any) => {
    // Handle both string and object content types
    if (typeof content === 'string') {
      return (
        <View style={styles.cardContent}>
          <Text style={styles.sectionText}>{content}</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.cardContent}>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>What - 这是什么</Text>
          <Text style={styles.sectionText}>{content?.what || '暂无内容'}</Text>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Why - 为什么重要</Text>
          <Text style={styles.sectionText}>{content?.why || '暂无内容'}</Text>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>So What - 意义何在</Text>
          <Text style={styles.sectionText}>{content?.soWhat || '暂无内容'}</Text>
        </View>
      </View>
    );
  };
  
  // 渲染构件标注卡片内容
  const renderComponentsCard = (content: any) => {
    if (typeof content === 'string') {
      return (
        <View style={styles.cardContent}>
          <Text style={styles.sectionText}>{content}</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.cardContent}>
        {content?.items?.map((component: any, index: number) => (
          <View key={index} style={styles.componentItem}>
            <Text style={styles.componentTerm}>{component?.term || '未知构件'}</Text>
            <Text style={styles.componentDescription}>{component?.description || '暂无描述'}</Text>
          </View>
        )) || <Text style={styles.sectionText}>暂无构件信息</Text>}
      </View>
    );
  };
  
  // 渲染时间线卡片内容
  const renderTimelineCard = (content: any) => {
    if (typeof content === 'string') {
      return (
        <View style={styles.cardContent}>
          <Text style={styles.sectionText}>{content}</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.cardContent}>
        {content?.events?.map((event: any, index: number) => (
          <View key={index} style={styles.timelineItem}>
            <View style={styles.timelineMarker} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineYear}>{event?.year || '未知年份'}</Text>
              <Text style={styles.timelineEvent}>{event?.event || '未知事件'}</Text>
              {event?.description && <Text style={styles.timelineDescription}>{event?.description || '暂无描述'}</Text>}
            </View>
          </View>
        )) || <Text style={styles.sectionText}>暂无时间线信息</Text>}
      </View>
    );
  };
  
  // 渲染人物关系卡片内容
  const renderPeopleCard = (content: any) => {
    if (typeof content === 'string') {
      return (
        <View style={styles.cardContent}>
          <Text style={styles.sectionText}>{content}</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.cardContent}>
        {content?.people?.map((person: any, index: number) => (
          <View key={index} style={styles.personItem}>
            <View style={styles.personHeader}>
              <Text style={styles.personName}>{person?.name || '未知人物'}</Text>
              <Text style={styles.personRole}>{person?.role || '未知角色'}</Text>
            </View>
            <Text style={styles.personDescription}>{person?.description || '暂无描述'}</Text>
            {person?.relationship && (
              <Text style={styles.personRelationship}>关系：{person.relationship}</Text>
            )}
          </View>
        )) || <Text style={styles.sectionText}>暂无人物信息</Text>}
      </View>
    );
  };
  
  // 渲染延伸阅读卡片内容
  const renderReadingCard = (content: any) => {
    if (typeof content === 'string') {
      return (
        <View style={styles.cardContent}>
          <Text style={styles.sectionText}>{content}</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.cardContent}>
        {content?.items?.map((item: any, index: number) => (
          <View key={index} style={styles.linkItem}>
            <View style={styles.linkHeader}>
              <Ionicons name="book" size={16} color={tokens.colors.accent.architecture} />
              <Text style={styles.linkTitle}>{item?.title || '未知标题'}</Text>
            </View>
            <Text style={styles.linkDescription}>{item?.description || '暂无描述'}</Text>
          </View>
        )) || <Text style={styles.sectionText}>暂无阅读资料</Text>}
      </View>
    );
  };
  
  // 渲染引用来源卡片内容
  const renderSourcesCard = (content: any) => {
    if (typeof content === 'string') {
      return (
        <View style={styles.cardContent}>
          <Text style={styles.sectionText}>{content}</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.cardContent}>
        {content?.sources?.map((source: any, index: number) => (
          <View key={index} style={styles.sourceItem}>
            <Text style={styles.sourceTitle}>{source?.title || '未知来源'}</Text>
            <Text style={styles.sourceAuthor}>作者：{source?.author || '未知作者'}</Text>
            <Text style={styles.sourceDate}>日期：{source?.date || '未知日期'}</Text>
            {source?.excerpt && <Text style={styles.sourceExcerpt}>{source?.excerpt || '暂无摘录'}</Text>}
          </View>
        )) || <Text style={styles.sectionText}>暂无引用来源</Text>}
      </View>
    );
  };
  
  // 渲染卡片内容
  const renderCardContent = (card: CardData) => {
    switch (card.type) {
      case 'what':
        return renderWhatCard(card.content);
      case 'components':
        return renderComponentsCard(card.content);
      case 'timeline':
        return renderTimelineCard(card.content);
      case 'people':
        return renderPeopleCard(card.content);
      case 'reading':
        return renderReadingCard(card.content);
      case 'sources':
        return renderSourcesCard(card.content);
      default:
        return (
          <View style={styles.cardContent}>
            <Text style={styles.defaultContent}>暂无内容</Text>
          </View>
        );
    }
  };
  
  if (!cards || cards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>暂无卡片内容</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* 卡片标签栏 */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
        contentContainerStyle={styles.tabContent}
      >
        {cards.map((card, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.tab,
              activeCardIndex === index && styles.activeTab
            ]}
            onPress={() => {
              setActiveCardIndex(index);
              onCardPress?.(card);
            }}
          >
            {renderCardIcon(card.type)}
            <Text style={[
              styles.tabText,
              activeCardIndex === index && styles.activeTabText
            ]}>
              {renderCardTitle(card.type)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* 卡片内容 */}
      <View style={styles.cardContainer}>
        {renderCardContent(cards[activeCardIndex])}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: tokens.spacing.md,
    marginVertical: tokens.spacing.lg,
  },
  
  emptyContainer: {
    padding: tokens.spacing.sm,
    alignItems: 'center',
  },
  
  emptyText: {
    fontSize: tokens.typography.fontSize.body,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
  },
  
  tabContainer: {
    marginBottom: tokens.spacing.md,
  },
  
  tabContent: {
    paddingHorizontal: tokens.spacing.md,
  },
  
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    marginRight: tokens.spacing.sm,
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.borderRadius.full,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
  },
  
  activeTab: {
    backgroundColor: tokens.colors.accent.architecture,
    borderColor: tokens.colors.accent.architecture,
  },
  
  tabText: {
    fontSize: tokens.typography.fontSize.body,
    color: tokens.colors.text,
    marginLeft: tokens.spacing.xs,
    fontFamily: tokens.typography.fontFamily.chinese,
  },
  
  activeTabText: {
    color: tokens.colors.text,
    fontWeight: '600',
  },
  
  cardContainer: {
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.lg,
    minHeight: 200,
  },
  
  cardContent: {
    flex: 1,
  },
  
  defaultContent: {
    fontSize: tokens.typography.fontSize.body,
    color: tokens.colors.text,
    textAlign: 'center',
    fontFamily: tokens.typography.fontFamily.chinese,
  },
  
  // What/Why/So-what 样式
  sectionContainer: {
    marginBottom: tokens.spacing.lg,
  },
  
  sectionTitle: {
    fontSize: tokens.typography.fontSize.h2,
    color: tokens.colors.accent.architecture,
    fontFamily: tokens.typography.fontFamily.chinese,
    fontWeight: '600',
    marginBottom: tokens.spacing.sm,
  },
  
  sectionText: {
    fontSize: tokens.typography.fontSize.body,
    lineHeight: tokens.typography.lineHeight.body,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
  },
  
  // 构件标注样式
  componentItem: {
    marginBottom: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },
  
  componentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.sm,
  },
  
  componentTerm: {
    fontSize: tokens.typography.fontSize.h2,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
    fontWeight: '600',
  },
  
  componentBadge: {
    backgroundColor: tokens.colors.accent.history,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.borderRadius.sm,
  },
  
  componentBadgeText: {
    fontSize: tokens.typography.fontSize.meta,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
  },
  
  componentDescription: {
    fontSize: tokens.typography.fontSize.body,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
    lineHeight: tokens.typography.lineHeight.body,
  },
  
  // 时间线样式
  timelineItem: {
    flexDirection: 'row',
    marginBottom: tokens.spacing.md,
  },
  
  timelineMarker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: tokens.colors.accent.architecture,
    marginTop: 6,
    marginRight: tokens.spacing.md,
  },
  
  timelineContent: {
    flex: 1,
  },
  
  timelineYear: {
    fontSize: tokens.typography.fontSize.h2,
    color: tokens.colors.accent.architecture,
    fontFamily: tokens.typography.fontFamily.english,
    fontWeight: '600',
    marginBottom: 2,
  },
  
  timelineEvent: {
    fontSize: tokens.typography.fontSize.body,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
    fontWeight: '500',
    marginBottom: tokens.spacing.xs,
  },
  
  timelineDescription: {
    fontSize: tokens.typography.fontSize.body,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
    lineHeight: tokens.typography.lineHeight.body,
  },
  
  // 人物关系样式
  personItem: {
    marginBottom: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },
  
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.sm,
  },
  
  personName: {
    fontSize: tokens.typography.fontSize.h2,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
    fontWeight: '600',
    marginRight: tokens.spacing.sm,
  },
  
  personRole: {
    fontSize: tokens.typography.fontSize.body,
    color: tokens.colors.accent.history,
    fontFamily: tokens.typography.fontFamily.chinese,
  },
  
  personDescription: {
    fontSize: tokens.typography.fontSize.body,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
    lineHeight: tokens.typography.lineHeight.body,
    marginBottom: tokens.spacing.xs,
  },
  
  personRelationship: {
    fontSize: tokens.typography.fontSize.meta,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
  },
  
  // 延伸阅读样式
  linkItem: {
    marginBottom: tokens.spacing.md,
    padding: tokens.spacing.md,
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.borderRadius.md,
  },
  
  linkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  
  linkTitle: {
    fontSize: tokens.typography.fontSize.body,
    color: tokens.colors.accent.architecture,
    fontFamily: tokens.typography.fontFamily.chinese,
    fontWeight: '500',
    marginLeft: tokens.spacing.xs,
  },
  
  linkDescription: {
    fontSize: tokens.typography.fontSize.body,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
    lineHeight: tokens.typography.lineHeight.body,
    marginBottom: tokens.spacing.xs,
  },
  
  linkUrl: {
    fontSize: tokens.typography.fontSize.meta,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.english,
  },
  
  // 引用来源样式
  sourceItem: {
    marginBottom: tokens.spacing.lg,
    paddingBottom: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.default,
  },
  
  sourceTitle: {
    fontSize: tokens.typography.fontSize.body,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
    fontWeight: '500',
    marginBottom: tokens.spacing.xs,
  },
  
  sourceAuthor: {
    fontSize: tokens.typography.fontSize.meta,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
    marginBottom: 2,
  },
  
  sourceDate: {
    fontSize: tokens.typography.fontSize.meta,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.english,
    marginBottom: tokens.spacing.sm,
  },
  
  sourceExcerpt: {
    fontSize: tokens.typography.fontSize.body,
    color: tokens.colors.text,
    fontFamily: tokens.typography.fontFamily.chinese,
    fontStyle: 'italic',
    lineHeight: tokens.typography.lineHeight.body,
    paddingLeft: tokens.spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: tokens.colors.accent.architecture,
  },
});