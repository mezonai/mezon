import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Dimensions, NativeEventEmitter, NativeModules, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { APP_SCREEN } from '../../navigation/ScreenTypes';

const { width, height } = Dimensions.get('window');

interface CallScreenProps {
    callerName?: string;
    callerAvatar?: string;
    callerId?: string;
    channelId?: string;
    callUUID?: string;
    offer?: string;
}

const CallScreen: React.FC<CallScreenProps> = (props) => {
    const navigation = useNavigation();
    const [callStatus, setCallStatus] = useState<'incoming' | 'connected' | 'ended'>('incoming');
    const [callDuration, setCallDuration] = useState(0);

    useEffect(() => {
        // Listen for call answered event
        const eventEmitter = new NativeEventEmitter(NativeModules.CallScreenViewController);
        const subscription = eventEmitter.addListener('CallAnswered', () => {
            setCallStatus('connected');
            startCallTimer();
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const startCallTimer = () => {
        const interval = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswer = () => {
        if (NativeModules.CallScreenViewController) {
            NativeModules.CallScreenViewController.answerCall();
        }
    };

    const handleDecline = () => {
        if (NativeModules.CallScreenViewController) {
            NativeModules.CallScreenViewController.declineCall();
        }
    };

    const handleEndCall = () => {
        if (NativeModules.CallScreenViewController) {
            NativeModules.CallScreenViewController.endCall();
        }
    };

    const navigateToCall = () => {
        navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
            screen: APP_SCREEN.MENU_CHANNEL.CALL_DIRECT,
            params: {
                receiverId: props.callerId,
                receiverAvatar: props.callerAvatar,
                directMessageId: props.channelId,
                isAnswerCall: true
            }
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Caller Info */}
                <View style={styles.callerInfo}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>
                            {props.callerName?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <Text style={styles.callerName}>{props.callerName || 'Unknown'}</Text>
                    <Text style={styles.callStatus}>
                        {callStatus === 'incoming' && 'Incoming Call'}
                        {callStatus === 'connected' && formatDuration(callDuration)}
                        {callStatus === 'ended' && 'Call Ended'}
                    </Text>
                </View>

                {/* Call Controls */}
                <View style={styles.controls}>
                    {callStatus === 'incoming' ? (
                        <>
                            <TouchableOpacity style={[styles.button, styles.declineButton]} onPress={handleDecline}>
                                <Text style={styles.buttonText}>Decline</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.answerButton]} onPress={handleAnswer}>
                                <Text style={styles.buttonText}>Answer</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity style={[styles.button, styles.endButton]} onPress={handleEndCall}>
                            <Text style={styles.buttonText}>End Call</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Navigate to Full Call Screen */}
                {callStatus === 'connected' && (
                    <TouchableOpacity style={styles.fullScreenButton} onPress={navigateToCall}>
                        <Text style={styles.fullScreenButtonText}>Open Full Call Screen</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

// temp UI
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 100,
        paddingHorizontal: 20,
    },
    callerInfo: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarText: {
        fontSize: 48,
        color: '#FFF',
        fontWeight: 'bold',
    },
    callerName: {
        fontSize: 24,
        color: '#FFF',
        fontWeight: '600',
        marginBottom: 10,
    },
    callStatus: {
        fontSize: 16,
        color: '#CCC',
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: 40,
    },
    button: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    answerButton: {
        backgroundColor: '#4CAF50',
    },
    declineButton: {
        backgroundColor: '#F44336',
    },
    endButton: {
        backgroundColor: '#F44336',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    fullScreenButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 20,
    },
    fullScreenButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CallScreen;
