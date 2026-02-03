import { AbsoluteFill, Sequence } from 'remotion';
import {
    MottoScene,
    RhetoricalScene,
    CustomScene,
    RecitationScene,
    TestScene,
    MistakesScene,
    AIScene,
    SyncScene,
    EndingScene
} from './Scenes';

export const FluentCardsPromo: React.FC = () => {
    return (
        <AbsoluteFill style={{ backgroundColor: '#ffffff' }}>
            {/* 1. Intro: 你自己的电子单词本 (0s - 2.8s) */}
            <Sequence from={0} durationInFrames={85}>
                <MottoScene />
            </Sequence>

            {/* 1.5. 反问式宣传 (2.8s - 4.8s) */}
            <Sequence from={85} durationInFrames={60}>
                <RhetoricalScene />
            </Sequence>

            {/* 2. 我的词库，我定义 (4.8s - 9.2s) */}
            <Sequence from={145} durationInFrames={130}>
                <CustomScene />
            </Sequence>

            {/* 2.5. 纸质记忆法，数字化进化 (9.2s - 14.2s) */}
            <Sequence from={275} durationInFrames={150}>
                <RecitationScene />
            </Sequence>

            {/* 3. 花式测试，随心组合 (14.2s - 17.5s) */}
            <Sequence from={425} durationInFrames={100}>
                <TestScene />
            </Sequence>

            {/* 4. 直面错题，地狱式进化 (17.5s - 20.9s) */}
            <Sequence from={525} durationInFrames={100}>
                <MistakesScene />
            </Sequence>

            {/* 5. AI 助阵，语境生辉 (20.9s - 24.2s) */}
            <Sequence from={625} durationInFrames={100}>
                <AIScene />
            </Sequence>

            {/* 6. 你的词库 如影随形 (24.2s - 28s) */}
            <Sequence from={725} durationInFrames={115}>
                <SyncScene />
            </Sequence>

            {/* 7. 结尾 - FluentCards现已发布 (28s - 31s) */}
            <Sequence from={840} durationInFrames={90}>
                <EndingScene />
            </Sequence>
        </AbsoluteFill>
    );
};
