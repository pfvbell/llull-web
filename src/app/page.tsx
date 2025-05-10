// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  useEffect(() => {
    console.log('Home splash page loaded');
  }, []);

  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-beige-50 to-white">
      {/* Hero section */}
      <section className="pt-20 pb-8 px-4">
        <div className={`max-w-6xl mx-auto transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="flex flex-col items-center justify-center text-center">
            <h1 className="heading-font text-5xl md:text-7xl font-bold text-green-700 mb-10">
              The Visual <span className="text-green-500">Memory App</span>
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/create" 
                className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-medium transition-colors shadow-lg hover:shadow-xl"
              >
                Visualize Your Learning
              </Link>
              <Link 
                href="/dashboard" 
                className="px-8 py-4 bg-beige-100 text-blue-600 rounded-lg hover:bg-beige-200 text-lg font-medium transition-colors border border-beige-200"
              >
                View Memory Bank
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Animated Flow Diagram */}
      <section className="pt-0 pb-16 px-4 bg-gradient-to-r from-beige-50 to-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl heading-font font-bold text-center mb-4">Transform Any Content Into Visual Memories</h2>
          
          <div className="relative h-[350px] md:h-[300px]">
            {/* Knowledge Sources Section */}
            <div className={`absolute top-[90px] left-0 w-full md:w-1/4 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{transitionDelay: '200ms'}}>
              <h3 className="text-xl font-bold text-center mb-4">Knowledge Sources</h3>
              <div className="flex flex-col items-center gap-4">
                {/* YouTube */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-md w-full max-w-[220px] border border-beige-100">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-medium">YouTube Videos</span>
                </div>
                
                {/* Articles */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-md w-full max-w-[220px] border border-beige-100">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <span className="font-medium">Web Articles</span>
                </div>
                
                {/* PDFs */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-md w-full max-w-[220px] border border-beige-100">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="font-medium">PDF Documents</span>
                </div>
              </div>
            </div>
            
            {/* Animated Flow Arrows */}
            <div className="absolute left-1/4 top-[125px] hidden md:block">
              <svg className="w-20 h-20 text-green-600" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M10 50 H60 L45 35 M45 65 L60 50" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className={`transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                  style={{
                    strokeDasharray: 100,
                    strokeDashoffset: isVisible ? 0 : 100,
                    transitionDelay: '600ms',
                    transitionProperty: 'stroke-dashoffset, opacity'
                  }}
                />
              </svg>
            </div>
            
            {/* Llull Processing Section */}
            <div className={`absolute top-[90px] left-1/2 transform -translate-x-1/2 transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} style={{transitionDelay: '800ms'}}>
              <div className="bg-green-600 text-white p-6 rounded-2xl shadow-xl w-64 h-64 flex flex-col items-center justify-center text-center relative overflow-hidden">
                {/* Background pulse effect */}
                <div className="absolute inset-0 bg-green-500 rounded-full opacity-20 animate-pulse" style={{ transform: 'scale(1.5)' }}></div>
                
                {/* LoadingIndicator-style animation */}
                <div className="relative w-32 h-32">
                  {/* First disk */}
                  <div 
                    className="absolute top-2 left-2 w-28 h-28 rounded-full bg-green-500 flex items-center justify-center z-10"
                    style={{ 
                      animation: 'spin 4s linear infinite',
                      transformOrigin: 'center center'
                    }}
                  >
                    <div className="w-full h-1 bg-green-400"></div>
                    <div className="h-full w-1 bg-green-400 absolute"></div>
                  </div>
                  
                  {/* Second disk */}
                  <div 
                    className="absolute top-2 left-2 w-28 h-28 rounded-full bg-green-600 flex items-center justify-center"
                    style={{ 
                      animation: 'spinReverse 4s linear infinite',
                      transformOrigin: 'center center'
                    }}
                  >
                    <div className="w-full h-1 bg-green-500"></div>
                    <div className="h-full w-1 bg-green-500 absolute"></div>
                  </div>
                  
                  {/* Llull logo on top */}
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <span className="heading-font text-3xl font-bold text-white">llull</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Animated Flow Arrows */}
            <div className="absolute right-1/4 top-[125px] hidden md:block">
              <svg className="w-20 h-20 text-green-600" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M40 50 H90 L75 35 M75 65 L90 50" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className={`transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                  style={{
                    strokeDasharray: 100,
                    strokeDashoffset: isVisible ? 0 : 100,
                    transitionDelay: '1000ms',
                    transitionProperty: 'stroke-dashoffset, opacity'
                  }}
                />
              </svg>
            </div>
            
            {/* Visual Memories Section */}
            <div className={`absolute top-[90px] right-0 w-full md:w-1/4 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{transitionDelay: '1200ms'}}>
              <h3 className="text-xl font-bold text-center mb-4">Visual Memories</h3>
              <div className="flex flex-col items-center gap-4">
                {/* Concept Maps */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-md w-full max-w-[220px] border border-beige-100">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <span className="font-medium">Concept Maps</span>
                </div>
                
                {/* Visual Storyboards */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-md w-full max-w-[220px] border border-beige-100">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="font-medium">Visual Storyboards</span>
                </div>
                
                {/* Flashcards */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-md w-full max-w-[220px] border border-beige-100">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="font-medium">Flashcards</span>
                </div>
              </div>
            </div>

            {/* Mobile Flow Arrows - Shown only on small screens */}
            <div className="md:hidden absolute left-1/2 transform -translate-x-1/2">
              <div className="h-8 flex justify-center">
                <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    d="M12 5v14M12 19l7-7M12 19l-7-7" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                    style={{
                      strokeDasharray: 40,
                      strokeDashoffset: isVisible ? 0 : 40,
                      transitionDelay: '600ms',
                      transitionProperty: 'stroke-dashoffset, opacity'
                    }}
                  />
                </svg>
              </div>
            </div>
            
            {/* Mobile View for Llull - Shown only on small screens */}
            <div className={`md:hidden absolute top-[160px] left-1/2 transform -translate-x-1/2 transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} style={{transitionDelay: '800ms'}}>
              <div className="bg-green-600 text-white p-4 rounded-xl shadow-lg w-48 h-48 flex flex-col items-center justify-center text-center relative overflow-hidden">
                {/* Background pulse effect */}
                <div className="absolute inset-0 bg-green-500 rounded-full opacity-20 animate-pulse" style={{ transform: 'scale(1.5)' }}></div>
                
                {/* LoadingIndicator-style animation - mobile version */}
                <div className="relative w-32 h-32">
                  {/* First disk */}
                  <div 
                    className="absolute top-1 left-1 w-28 h-28 rounded-full bg-green-500 flex items-center justify-center z-10"
                    style={{ 
                      animation: 'spin 4s linear infinite',
                      transformOrigin: 'center center'
                    }}
                  >
                    <div className="w-full h-1 bg-green-400"></div>
                    <div className="h-full w-1 bg-green-400 absolute"></div>
                  </div>
                  
                  {/* Second disk */}
                  <div 
                    className="absolute top-1 left-1 w-28 h-28 rounded-full bg-green-600 flex items-center justify-center"
                    style={{ 
                      animation: 'spinReverse 4s linear infinite',
                      transformOrigin: 'center center'
                    }}
                  >
                    <div className="w-full h-1 bg-green-500"></div>
                    <div className="h-full w-1 bg-green-500 absolute"></div>
                  </div>
                  
                  {/* Llull logo on top */}
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <span className="heading-font text-3xl font-bold text-white">llull</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile Flow Arrows - Bottom Arrow */}
            <div className="md:hidden absolute left-1/2 transform -translate-x-1/2 top-[325px]">
              <div className="h-8 flex justify-center">
                <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    d="M12 5v14M12 19l7-7M12 19l-7-7" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                    style={{
                      strokeDasharray: 40,
                      strokeDashoffset: isVisible ? 0 : 40,
                      transitionDelay: '1000ms',
                      transitionProperty: 'stroke-dashoffset, opacity'
                    }}
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16 bg-beige-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl heading-font font-bold text-center mb-4">The Power of Visual Learning</h2>
          <p className="text-xl text-center text-gray-600 mb-16">Research shows visual learners retain information better than text alone</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Concept Maps",
                description: "See connections between ideas with interactive node-based maps for better understanding",
                icon: (
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                )
              },
              {
                title: "Visual Storyboards",
                description: "Transform concepts into visual narratives with icons that make complex ideas stick",
                icon: (
                  <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )
              },
              {
                title: "Flashcards",
                description: "Visual cues combined with spaced repetition for maximum memory retention",
                icon: (
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )
              },
              {
                title: "Interactive Quizzes",
                description: "Visual question formats that test knowledge while reinforcing visual memory",
                icon: (
                  <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-beige-100"
              >
                <div className="bg-beige-50 w-16 h-16 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual learning benefits */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl heading-font font-bold text-center mb-4">Why Visual Learning Works</h2>
          <p className="text-xl text-center text-gray-600 mb-16">Research Shows we learn better from visual content</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Stronger Connections",
                description: "Visualizing relationships between concepts creates stronger neural connections in your brain",
                icon: (
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              },
              {
                title: "Dual Coding",
                description: "Combining visual and verbal information creates two memory pathways for recall",
                icon: (
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                )
              },
              {
                title: "Pattern Recognition",
                description: "Visual learning leverages your brain's natural pattern recognition abilities",
                icon: (
                  <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                )
              }
            ].map((benefit, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-beige-50 flex items-center justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link 
              href="/create" 
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg inline-flex items-center transition-colors"
            >
              Start Visual Learning
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section className="py-16 bg-beige-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl heading-font font-bold text-center mb-4">How It Works</h2>
          <p className="text-xl text-center text-gray-600 mb-16">Transform any content into visual learning materials in minutes</p>
          
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            {[
              {
                step: "1",
                title: "Import Content",
                description: "Upload PDFs, paste text, use YouTube videos, or web pages as your source material",
                color: "blue"
              },
              {
                step: "2",
                title: "Generate Visual Resources",
                description: "Our AI creates concept maps, storyboards, and more from your content",
                color: "green"
              },
              {
                step: "3",
                title: "Visualize & Remember",
                description: "Use our visual spaced repetition system to remember what you learn",
                color: "purple"
              }
            ].map((step, index) => (
              <div key={index} className="flex-1 text-center md:text-left">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-4 mx-auto md:mx-0 ${
                  step.color === 'blue' ? 'bg-blue-100 text-blue-600' : 
                  step.color === 'green' ? 'bg-green-100 text-green-600' : 
                  'bg-purple-100 text-purple-600'
                }`}>
                  {step.step}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial/CTA section */}
      <section className="py-16 rounded-t-3xl">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-white p-8 rounded-2xl shadow-xl mb-12 relative">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mt-4 mb-6">"I've never been able to retain information this effectively. The visual concept maps changed everything."</h3>
            <p className="text-gray-600 italic">Llull combines visual learning with proven memory techniques to help you learn faster and remember longer.</p>
          </div>
          
          <h2 className="text-3xl md:text-4xl heading-font font-bold mb-6">Ready to see knowledge differently?</h2>
          <p className="text-xl text-gray-700 mb-8">Join thousands of visual learners transforming how they study and remember.</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/create" 
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-medium transition-colors shadow-lg"
            >
              Create Your First Visual Map
            </Link>
            <Link 
              href="/reader" 
              className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-beige-100 text-lg font-medium transition-colors border border-beige-200"
            >
              Try the Visual Reader
            </Link>
          </div>
        </div>
      </section>

      {/* Animation styles */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes spinReverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
      `}</style>
    </div>
  );
}