import { PiCaretRightBold } from 'react-icons/pi'
import { useState } from 'react'
import { MouseScrollIcon } from '../utils'

export const AboutInfo = () => {
    const [isExpanded, setIsExpanded] = useState(false)
    const percentofheightofwindow = window.innerHeight * 0.8

    return (
        <div className=''>
            <button className='flex flex-row items-center justify-center gap-1 text-black md:hover:text-gray-500' onClick={() => setIsExpanded(!isExpanded)}>
                <span className='text-[16px]'>{isExpanded ? 'less' : 'more'}</span>
                <PiCaretRightBold size={16} className={`transition-transform duration-300 mt-[2px] ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
            {isExpanded && (
                <div className='relative max-w-screen md:w-[1000px] flex flex-row items-start justify-start '>
                    <div className='relative m-2.5 w-full'>
                        <div className={`relative p-2.5 flex flex-col gap-10 text-[24px] font-noto-sans text-[#1A4561] rounded bg-white/95 border border-black/10 overflow-y-scroll`} style={{ letterSpacing: '0.05em', height: `${percentofheightofwindow}px` }}>
                            <p>
                                Hello and welcome. I'm Max Vink, a developer and cyclist based in Berkeley, CA.
                                I graduated from UC Berkeley in 2024 with a B.S. in Computer Science and a B.A. in Political Science.
                                Since then, I've been working as a software engineer at Silicon, a FinTech startup focused on capital aquisition for
                                datacenter infrastructure. I also work as a freelance contractor, building software for companies without a dedicated engineering team.
                                In both roles, I've built full-stack web applications on a tech stack primarily composed of React, TypeScript, and Tailwind CSS on the frontend,
                                JavaScript RESTful APIs on the backend, and Postgres for the database, and Supabase, AWS Lambda, and Netlify for the infrastructure.
                            </p>
                            <p>
                                I have additional skills with most languages and frameworks, including and especially Python, Java, and C.
                                I also have experience with machine learning, robotics, and data engineering. I'm passionate about
                                building software that is both functional and aesthetically pleasing, and I'm always looking for new challenges and opportunities to grow.
                            </p>
                            <p>
                                I'm also an amatuer cyclist competing at the highest level of the sport in California.
                                I love to race bikes, eat carbohydrates, and entertain my strava followers. You can{' '}
                                <a href='https://strava.com/athletes/maxvink' target='_blank' rel='noopener noreferrer' className='hover:underline mouse-pointer'><span className='text-[#E6B389]'>explore some of that here</span></a>.
                            </p>
                            <p>
                                Part of the purpose of this website is to document those skills and projects. The other purpose is to demonstrate qualities that are
                                difficult to communicate in a resume, including and especially technical complexity, passion, personality, growth, and aesthetic taste.
                                Consequently, this website is a work in progress, and I will continue to update it as I learn and grow. To that end, here is a{' '}
                                <a href='https://mjv11.github.io/' target='_blank' rel='noopener noreferrer' className='hover:underline mouse-pointer'><span className='text-[#E6B389]'>link to my first portfolio</span></a>,
                                which I built in 2023 in vanilla JS and HTML, and so decided not to update but instead remake from scratch in React here.
                            </p>
                            <p>
                                As you explore, I hope this website offers insight into my hobbies and abilities, and I hope you enjoy your time here.
                            </p>
                        </div>
                    </div>
                    <div className='flex flex-col items-center justify-center my-2.5 pt-2.5'>
                    <MouseScrollIcon />
                    <span className='text-[11px] font-noto-sans tracking-widest uppercase text-black opacity-50'>scroll</span>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AboutInfo