// src/components/ConceptMapReview.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ReactFlow, 
  ReactFlowProvider, 
  Background, 
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  PanelPosition,
  Controls,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ConceptMap } from '@/types/index';
import { supabase } from '@/lib/supabase';
import { getLayoutedElements } from '@/lib/utils/layout';
import { updateResourceReviewStatus } from '@/lib/review-queue';
// Import using dynamic import to avoid TypeScript issues
import dynamic from 'next/dynamic';

// Define the ReviewAnswer interface
interface ReviewAnswer {
  nodeId: string;
  correctLabel: string;
  userLabel: string | null;
  isCorrect: boolean;
}

// Dynamic imports for components
const ConceptEdge = dynamic(() => import('./flow/ConceptEdge'), { ssr: false });
const ReviewNode = dynamic(() => import('../components/flow/ReviewNode'), { ssr: false });

// Log for debugging
const log = (message: string, data?: any) => {
  console.log(`[ConceptMapReview] ${message}`, data ? data : '');
};

interface ConceptMapReviewProps {
  conceptMap: ConceptMap;
  onComplete?: (score: number, total: number, viewingAnswers?: boolean, hintsUsed?: boolean) => void;
}

// Node types for review mode
const nodeTypes = {
  review: ReviewNode as any,
};

// Edge types (reusing from the editor)
const edgeTypes = {
  concept: ConceptEdge as any,
};

function ConceptMapReviewFlow({ conceptMap, onComplete }: ConceptMapReviewProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [availableLabels, setAvailableLabels] = useState<string[]>([]);
  const [draggedLabel, setDraggedLabel] = useState<string | null>(null);
  const [answers, setAnswers] = useState<ReviewAnswer[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const reactFlowInstance = useReactFlow();
  const router = useRouter();
  const [completionType, setCompletionType] = useState<'automatic' | 'skipped' | 'done'>('automatic');
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(false);
  
  // Initialize the review
  useEffect(() => {
    if (!conceptMap || !conceptMap.versions) return;
    
    log('Initializing review for concept map', {
      title: conceptMap.title,
      complexity: conceptMap.complexity
    });
    
    // Get nodes and edges from the current complexity level
    const version = conceptMap.versions.find(v => v.level === conceptMap.complexity);
    if (!version) return;
    
    try {
      // Create a shuffled array of labels
      // We need to extract labels from node.data.label or fallback to node.label for compatibility
      const labels = version.nodes.map(node => {
        if (typeof node === 'object' && node !== null) {
          return node.data?.label || (node as any).label || 'Unnamed Concept';
        }
        return 'Unnamed Concept';
      }).sort(() => Math.random() - 0.5);
      
      setAvailableLabels(labels);
      
      // Initialize answers
      const initialAnswers = version.nodes.map(node => {
        const nodeLabel = node.data?.label || (node as any).label || 'Unnamed Concept';
        return {
          nodeId: node.id,
          correctLabel: nodeLabel,
          userLabel: null,
          isCorrect: false,
        };
      });
      
      setAnswers(initialAnswers);
      
      // Create review nodes (without labels)
      const reviewNodes = version.nodes.map(node => {
        const nodeLabel = node.data?.label || (node as any).label || 'Unnamed Concept';
        
        // Make sure to set userLabel to null explicitly
        return {
          ...node,
          type: 'review',
          data: { 
            id: node.id,
            label: '', // Hide the actual label
            correctLabel: nodeLabel,
            userLabel: null, // Set explicitly to null
            isCorrect: false,
            onLabelDrop: handleNodeLabelDrop,
            onLabelRemove: handleRemoveLabel,
          },
        };
      });
      
      log('Created review nodes:', reviewNodes.map(n => ({ 
        id: n.id, 
        correctLabel: n.data.correctLabel,
        userLabel: n.data.userLabel
      })));
      
      // Use the same edges
      const reviewEdges = version.edges.map(edge => ({
        ...edge,
        type: 'concept',
        data: { 
          label: edge.data?.label || (edge as any).label || '',
        },
      }));
      
      // Apply layout using dagre
      const { nodes: layoutedNodes, edges: layoutedEdges } = 
        getLayoutedElements(reviewNodes, reviewEdges, 'TB');
      
      // Make sure layouted nodes keep their data properties
      const finalNodes = layoutedNodes.map(layoutedNode => {
        const originalNode = reviewNodes.find(n => n.id === layoutedNode.id);
        if (originalNode) {
          return {
            ...layoutedNode,
            data: originalNode.data // Preserve original data to prevent loss of properties
          };
        }
        return layoutedNode;
      });
      
      log('Setting up review with nodes and edges', {
        nodeCount: finalNodes.length,
        edgeCount: layoutedEdges.length,
        nodes: finalNodes.map(node => ({
          id: node.id,
          userLabel: node.data?.userLabel,
          correctLabel: node.data?.correctLabel
        }))
      });
      
      setNodes(finalNodes);
      setEdges(layoutedEdges);
      
      // Fit view after nodes are positioned
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2 });
      }, 50);
    } catch (error) {
      console.error('[ConceptMapReview] Error initializing review:', error);
    }
  }, [conceptMap, reactFlowInstance]);

  // Handle removing a label from a node
  const handleRemoveLabel = useCallback((nodeId: string) => {
    log('Removing label from node', { nodeId });
    
    // Get the current label from the node before removing it
    const nodeToUpdate = answers.find(a => a.nodeId === nodeId);
    
    if (nodeToUpdate && nodeToUpdate.userLabel) {
      const labelToReturn = nodeToUpdate.userLabel;
      
      // Add the label back to available labels
      setAvailableLabels(prevLabels => [...prevLabels, labelToReturn]);
      
      // Update the node UI
      setNodes((nds: any) => {
        try {
          return nds.map((node: any) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  userLabel: null,
                  isCorrect: false,
                  onLabelDrop: handleNodeLabelDrop,
                  onLabelRemove: handleRemoveLabel,
                }
              };
            }
            return node;
          });
        } catch (error) {
          console.error('[ConceptMapReview] Error updating nodes:', error);
          return nds;
        }
      });
      
      // Update answers
      setAnswers(prevAnswers => 
        prevAnswers.map(answer => {
          if (answer.nodeId === nodeId) {
            return {
              ...answer,
              userLabel: null,
              isCorrect: false
            };
          }
          return answer;
        })
      );
      
      log('Label removed and returned to available labels', { label: labelToReturn });
    }
  }, [answers, setNodes]);

  // Handle dropping a label on a node
  const handleNodeLabelDrop = useCallback((nodeId: string, label: string) => {
    log('Label dropped on node', { nodeId, label });
    
    // First check if this is a label that's already assigned to another node
    const existingNode = answers.find(a => a.userLabel === label);
    if (existingNode) {
      // Remove the label from its current node first
      handleRemoveLabel(existingNode.nodeId);
      log('Label was already assigned to another node, removing it first', { 
        label, 
        fromNodeId: existingNode.nodeId 
      });
    }
    
    const correctLabel = answers.find(a => a.nodeId === nodeId)?.correctLabel || '';
    const isCorrect = correctLabel === label;
    
    log('Checking if label is correct', { 
      nodeId, 
      label, 
      correctLabel, 
      isCorrect 
    });
    
    // Make a deep copy of the current nodes to prevent reference issues
    const currentNodes = [...nodes];
    
    // Update the node UI
    setNodes((nds: any) => {
      try {
        console.log('[ConceptMapReview] Before updating nodes:', 
          nds.map((n: any) => ({ id: n.id, userLabel: n.data?.userLabel }))
        );
        
        const updatedNodes = nds.map((node: any) => {
          // Important: create a completely new data object to avoid reference issues
          if (node.id === nodeId) {
            const updatedNode = {
              ...node,
              data: {
                ...node.data,
                userLabel: label,
                isCorrect,
                onLabelDrop: handleNodeLabelDrop,
                onLabelRemove: handleRemoveLabel,
              }
            };
            console.log(`[ConceptMapReview] Updating node ${nodeId}:`, {
              before: node.data?.userLabel,
              after: updatedNode.data?.userLabel
            });
            return updatedNode;
          }
          
          // Make sure we keep the reference functions for other nodes too
          return {
            ...node,
            data: {
              ...node.data,
              onLabelDrop: handleNodeLabelDrop,
              onLabelRemove: handleRemoveLabel,
            }
          };
        });
        
        console.log('[ConceptMapReview] After updating nodes:', 
          updatedNodes.map((n: any) => ({ id: n.id, userLabel: n.data?.userLabel }))
        );
        
        return updatedNodes;
      } catch (error) {
        console.error('[ConceptMapReview] Error updating nodes:', error);
        return nds;
      }
    });
    
    // Update answers with the new label
    setAnswers(prevAnswers => {
      console.log('[ConceptMapReview] Before updating answers:', 
        prevAnswers.map(a => ({ nodeId: a.nodeId, userLabel: a.userLabel }))
      );
      
      const updatedAnswers = prevAnswers.map(answer => {
        if (answer.nodeId === nodeId) {
          return {
            ...answer,
            userLabel: label,
            isCorrect
          };
        }
        return answer;
      });
      
      console.log('[ConceptMapReview] After updating answers:', 
        updatedAnswers.map(a => ({ nodeId: a.nodeId, userLabel: a.userLabel }))
      );
      
      // Check if all nodes have labels AFTER the update
      // This ensures we use the most recent state after the changes
      const allAnswered = updatedAnswers.every(answer => answer.userLabel !== null);
      log(`After answer update, allAnswered = ${allAnswered} (${updatedAnswers.filter(a => a.userLabel !== null).length}/${updatedAnswers.length} nodes labeled)`);
      
      // Only complete the review here if ALL nodes have labels
      if (allAnswered) {
        log('All nodes have been labeled, automatically completing review');
        // Use setTimeout to ensure this runs after state updates are processed
        setTimeout(() => {
          completeReview(updatedAnswers, 'automatic');
        }, 50);
      }
      
      return updatedAnswers;
    });
    
    // Remove the label from available labels
    setAvailableLabels(prevLabels => prevLabels.filter(l => l !== label));
    setDraggedLabel(null);
    
    // We no longer check for completion here since we now do it in the setAnswers callback
    // This ensures we're using the most up-to-date state
  }, [answers, nodes, setNodes, handleRemoveLabel]);

  // Handle manual completion of review (for skip button)
  const handleSkipReview = useCallback(() => {
    log('Review skipped by user');
    setIsComplete(true);
    setCompletionType('skipped');
    
    // Count correct and total answers
    const correctCount = answers.filter(answer => answer.isCorrect).length;
    const totalCount = answers.length;
    const attemptedCount = answers.filter(answer => answer.userLabel !== null).length;
    
    log('Skip review statistics', {
      correct: correctCount,
      total: totalCount,
      attempted: attemptedCount,
      percentageAttempted: Math.round((attemptedCount / totalCount) * 100),
      percentageCorrect: attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0
    });
    
    setScore(correctCount);
    
    // Update the review stats in the database
    updateReviewStats(correctCount, totalCount, 'skipped');

    // We don't call onComplete here anymore
    // The user will need to explicitly click on a button to move to the next review
  }, [answers, hintsUsed]);

  // Handle manual completion when the user clicks "Done"
  const handleDoneReview = useCallback(() => {
    log('Review marked as done by user');
    
    const correctCount = answers.filter(answer => answer.isCorrect).length;
    const totalCount = answers.length;
    const attemptedCount = answers.filter(answer => answer.userLabel !== null).length;
    
    log('Done review statistics', {
      correct: correctCount,
      total: totalCount,
      attempted: attemptedCount,
      percentageAttempted: Math.round((attemptedCount / totalCount) * 100),
      percentageCorrect: attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0
    });
    
    completeReview(answers, 'done');
  }, [answers]);

  // Complete review and calculate score
  const completeReview = useCallback((currentAnswers: ReviewAnswer[] = answers, completionType: 'automatic' | 'skipped' | 'done' = 'automatic') => {
    // Add detailed logging for debugging
    log(`Completing review (type: ${completionType})`, {
      answersCount: currentAnswers.length,
      filledAnswers: currentAnswers.filter(a => a.userLabel !== null).length,
      onCompleteProp: !!onComplete
    });
    
    // Calculate score
    const correctCount = currentAnswers.filter(a => a.isCorrect).length;
    const totalCount = currentAnswers.length;
    const answeredCount = currentAnswers.filter(a => a.userLabel !== null).length;
    
    log('Review statistics', {
      correct: correctCount,
      total: totalCount,
      wasSkipped: completionType === 'skipped',
      percentage: answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0
    });
    
    setScore(correctCount);
    setIsComplete(true);
    
    // Store the completion type to display appropriate message
    setCompletionType(completionType);
    
    // Update the review stats in the database
    // Even if skipped, we still record this as a review attempt
    updateReviewStats(correctCount, totalCount, completionType);

    // We don't call onComplete here anymore
    // The user will need to explicitly click on a button to move to the next review
  }, [answers, hintsUsed]);

  // Handle dragging a label
  const onDragStart = (event: React.DragEvent, label: string) => {
    event.dataTransfer.setData('text/plain', label);
    setDraggedLabel(label);
    log('Started dragging label', { label });
  };

  // Update the review statistics in the database
  const updateReviewStats = async (score: number, total: number, completionType: string = 'automatic') => {
    if (!conceptMap.id) {
      log('No concept map ID, skipping database update');
      return;
    }
    
    try {
      log('Starting database update for review stats', {
        score,
        total,
        completionType,
        mapId: conceptMap.id
      });
      
      // Use the new Llull Algorithm for spaced repetition
      const success = await updateResourceReviewStatus(
        conceptMap.id,
        score,
        total,
        'concept-map'
      );
      
      if (success) {
        log('Database update successful using Llull Algorithm');
      } else {
        log('Database update failed');
      }
    } catch (error) {
      console.error('[ConceptMapReview] Error updating review stats:', error);
    }
  };

  // Show the correct answers on the diagram
  const showCorrect = () => {
    log('Showing correct answers on diagram');
    setShowCorrectAnswers(true);
    
    // Notify the parent component we're viewing answers to prevent auto-advancing
    if (onComplete) {
      log('Notifying parent component that we are viewing answers');
      onComplete(score, answers.length, true, hintsUsed);
    }
    
    // Update nodes to show correct labels
    setNodes((nds: any) => {
      try {
        return nds.map((node: any) => {
          const answer = answers.find(a => a.nodeId === node.id);
          return {
            ...node,
            data: {
              ...node.data,
              // Show the correct label instead of user label
              showingCorrect: true,
              userLabel: answer?.correctLabel,
              isCorrect: true, // Mark all nodes as correct in display mode
              onLabelDrop: handleNodeLabelDrop,
              onLabelRemove: handleRemoveLabel,
            }
          };
        });
      } catch (error) {
        console.error('[ConceptMapReview] Error showing correct answers:', error);
        return nds;
      }
    });
    
    // Fit view after updating nodes to ensure all are visible
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2 });
    }, 50);
  };

  // Reset review session
  const resetReview = () => {
    log('Resetting review session');
    setIsComplete(false);
    setShowCorrectAnswers(false);
    
    const version = conceptMap.versions.find(v => v.level === conceptMap.complexity);
    if (!version) return;
    
    // Reset available labels
    const labels = version.nodes.map(node => {
      const nodeLabel = node.data?.label || (node as any).label || 'Unnamed Concept';
      return nodeLabel;
    }).sort(() => Math.random() - 0.5);
    
    setAvailableLabels(labels);
    
    // Reset answers
    const initialAnswers = version.nodes.map(node => {
      const nodeLabel = node.data?.label || (node as any).label || 'Unnamed Concept';
      return {
        nodeId: node.id,
        correctLabel: nodeLabel,
        userLabel: null,
        isCorrect: false,
      };
    });
    
    setAnswers(initialAnswers);
    
    // Reset nodes
    setNodes((nds: any) => {
      try {
        return nds.map((node: any) => ({
          ...node,
          data: {
            ...node.data,
            userLabel: null,
            isCorrect: false,
            showingCorrect: false,
            onLabelDrop: handleNodeLabelDrop,
            onLabelRemove: handleRemoveLabel,
          }
        }));
      } catch (error) {
        console.error('[ConceptMapReview] Error resetting nodes:', error);
        return nds;
      }
    });
    
    log('Review session reset complete');
  };

  // Add a function to provide hints by filling in 1/3 of the nodes
  const showHints = useCallback(() => {
    log('Showing hints by filling in 1/3 of the nodes');
    setHintsUsed(true);
    
    // Get nodes that don't have labels yet
    const emptyNodes = answers.filter(answer => answer.userLabel === null);
    if (emptyNodes.length === 0) {
      log('No empty nodes to fill with hints');
      return;
    }
    
    // Determine how many nodes to fill (approximately 1/3 of empty nodes)
    const nodesToFill = Math.max(1, Math.ceil(emptyNodes.length / 3));
    log(`Will fill ${nodesToFill} out of ${emptyNodes.length} empty nodes with hints`);
    
    // Shuffle the empty nodes to randomly select which ones to fill
    const shuffledEmptyNodes = [...emptyNodes].sort(() => Math.random() - 0.5);
    const nodesToHint = shuffledEmptyNodes.slice(0, nodesToFill);
    
    // For each node to hint, find its correct label and place it
    nodesToHint.forEach(nodeAnswer => {
      const correctLabel = nodeAnswer.correctLabel;
      const nodeId = nodeAnswer.nodeId;
      
      log(`Providing hint for node ${nodeId}: ${correctLabel}`);
      
      // Remove the label from available labels
      setAvailableLabels(prevLabels => prevLabels.filter(label => label !== correctLabel));
      
      // Update the answer
      setAnswers(prevAnswers => 
        prevAnswers.map(answer => {
          if (answer.nodeId === nodeId) {
            return {
              ...answer,
              userLabel: correctLabel,
              isCorrect: true
            };
          }
          return answer;
        })
      );
      
      // Update the node UI
      setNodes((nds: any) => {
        try {
          return nds.map((node: any) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  userLabel: correctLabel,
                  isCorrect: true,
                  onLabelDrop: handleNodeLabelDrop,
                  onLabelRemove: handleRemoveLabel,
                }
              };
            }
            return node;
          });
        } catch (error) {
          console.error('[ConceptMapReview] Error updating nodes for hints:', error);
          return nds;
        }
      });
    });
    
    // Check if all nodes now have labels
    const updatedAnswers = answers.map(a => {
      const nodeToHint = nodesToHint.find(n => n.nodeId === a.nodeId);
      if (nodeToHint) {
        return { ...a, userLabel: nodeToHint.correctLabel, isCorrect: true };
      }
      return a;
    });
    
    const allAnswered = updatedAnswers.every(answer => answer.userLabel !== null);
    if (allAnswered) {
      log('All nodes have been labeled after hints, completing review');
      completeReview(updatedAnswers, 'automatic');
    }
  }, [answers, setNodes, availableLabels, handleNodeLabelDrop, handleRemoveLabel]);

  return (
    <div className="w-full h-full">
      {isComplete ? (
        <div className={`absolute ${showCorrectAnswers ? 'top-1/3 right-3 w-80' : 'left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-md w-full'} z-10 bg-white p-6 rounded-lg shadow-lg`}>
          <h3 className="text-xl font-semibold mb-2">Review Complete!</h3>
          <p className="text-green-600 text-sm mb-4">
            {completionType === 'automatic' && 'Great job completing all labels!'}
            {completionType === 'done' && 'Review completed successfully!'}
            {completionType === 'skipped' && 'This review has been skipped but still recorded.'}
            <br />
            Your review has been recorded in your Memory Bank.
          </p>
          
          {showCorrectAnswers ? (
            <div className="mb-4">
              <p className="text-sm text-blue-600 font-medium">
                Correct answers are now shown on the diagram.
              </p>
              <button
                onClick={() => setShowCorrectAnswers(false)}
                className="w-full mt-2 px-3 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm"
              >
                Back to Results
              </button>
            </div>
          ) : (
            <>
              <p className="text-lg mb-4">
                Your score: <span className="font-bold">{score}</span> out of <span className="font-bold">{answers.length}</span>
                {answers.filter(a => a.userLabel !== null).length > 0 && (
                  <> ({Math.round((score / answers.filter(a => a.userLabel !== null).length) * 100)}%)</>
                )}
                {hintsUsed && (
                  <span className="text-xs text-gray-500 ml-2">(with hints)</span>
                )}
              </p>
              
              <div className="mb-6 max-h-60 overflow-y-auto">
                <h4 className="font-medium mb-2">Review:</h4>
                <ul className="space-y-2">
                  {answers.map(answer => (
                    <li key={answer.nodeId} className="flex items-center">
                      {answer.userLabel === null ? (
                        <span className="mr-2 text-gray-400">□</span>
                      ) : (
                        <span className={`mr-2 ${answer.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                          {answer.isCorrect ? '✓' : '✗'}
                        </span>
                      )}
                      <span className="font-medium">{answer.correctLabel}</span>
                      {!answer.isCorrect && answer.userLabel && (
                        <span className="ml-2 text-red-500">
                          (you answered: {answer.userLabel})
                        </span>
                      )}
                      {answer.userLabel === null && (
                        <span className="ml-2 text-gray-500 italic">(not attempted)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
          
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => {
                log('User clicked "Return to Memory Bank" button');
                router.push('/dashboard');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Return to Memory Bank
            </button>
            <button
              onClick={resetReview}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Review Again
            </button>
            {onComplete && (
              <button
                onClick={() => {
                  if (showCorrectAnswers) {
                    // If we're showing correct answers, first hide them before advancing
                    setShowCorrectAnswers(false);
                    // Then notify we're no longer viewing answers
                    onComplete(score, answers.length, false, hintsUsed);
                  } else {
                    log('User clicked "Next Review" button');
                    onComplete(score, answers.length, false, hintsUsed);
                  }
                }}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Next Review
              </button>
            )}
          </div>
          
          {!showCorrectAnswers && (
            <div className="mt-2">
              <button
                onClick={showCorrect}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Show Correct Answers
              </button>
            </div>
          )}
        </div>
      ) : null}
      
      {/* Main diagram */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.4, includeHiddenNodes: false, maxZoom: 1 }}
        minZoom={0.2}
        maxZoom={4}
        className={`${showCorrectAnswers ? 'bg-green-50' : 'bg-gray-50'}`}
      >
        <Background variant={BackgroundVariant.Dots} color={showCorrectAnswers ? "#4ade80" : "#aaa"} gap={12} size={1} />
        <Controls showInteractive={false} position="bottom-right" />
        
        {/* Correct answers indicator */}
        {showCorrectAnswers && (
          <div className="absolute bottom-3 left-3 z-10 bg-green-100 text-green-800 px-3 py-2 rounded-md shadow-md text-sm font-medium">
            Showing Correct Answers
          </div>
        )}
        
        {/* Create a container for both panels */}
        <div className="absolute top-3 right-3 z-10">
          {/* Labels panel */}
          <div className="bg-white p-3 rounded-md shadow-md mb-4">
            <div className="w-40">
              <h3 className="font-medium mb-2 text-sm">Available Labels</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {availableLabels.map(label => (
                  <div
                    key={label}
                    draggable
                    onDragStart={(e) => onDragStart(e, label)}
                    className="p-2 bg-blue-50 border border-blue-100 rounded-md cursor-move hover:bg-blue-100 text-center text-sm"
                  >
                    {label}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                Drag labels onto the correct nodes in the diagram.
                <br/>
                Use the ↻ button on a node to remove its label.
              </div>
            </div>
          </div>
          
          {/* Progress and buttons panel - directly below the labels panel */}
          <div className="bg-white p-3 rounded-md shadow-md">
            <div className="w-40">
              <h3 className="font-medium mb-2 text-sm">Progress</h3>
              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.round((answers.filter(a => a.userLabel !== null).length / answers.length) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs mt-1 text-gray-600">
                  {answers.filter(a => a.userLabel !== null).length} / {answers.length} nodes labeled
                </p>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={handleSkipReview}
                  className="w-full px-3 py-1.5 rounded text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-800 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                  Finish
                </button>
                
                <button
                  onClick={resetReview}
                  className="w-full px-3 py-1.5 rounded text-sm font-medium bg-yellow-500 hover:bg-yellow-600 text-white flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Restart Review
                </button>
                
                <button
                  onClick={showHints}
                  className="w-full px-3 py-1.5 rounded text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
                  disabled={hintsUsed || answers.every(a => a.userLabel !== null)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Show Hints
                </button>
              </div>
              
              <div className="mt-2 text-xs text-gray-500 italic">
                "Skip Review" will save your progress.
                <br />
                "Restart Review" will reset all labels without saving.
                <br />
                "Show Hints" will fill in 1/3 of the empty nodes.
              </div>
            </div>
          </div>
        </div>
      </ReactFlow>
    </div>
  );
}

export default function ConceptMapReview(props: ConceptMapReviewProps) {
  return (
    <div className="h-[80vh] w-full my-4">
      <ReactFlowProvider>
        <ConceptMapReviewFlow {...props} />
      </ReactFlowProvider>
    </div>
  );
}