import { PiEnvelope, PiArrowSquareOutBold } from 'react-icons/pi'
import { FaGithub, FaLinkedin, FaStrava } from "react-icons/fa";
import { FiInstagram } from "react-icons/fi";

export const Contact = () => {
    return (
        <div className='flex flex-col flex-1 gap-4 py-16 px-6 h-full justify-center'>
            <p className='text-black font-jost text-[24px] font-medium'>
                I'm always looking for new opportunities and collaborations. You can contact me via the following channels.
            </p>
            <div className='flex flex-col gap-4 mt-[200px] md:mt-0 '>
                {
                    [
                        {
                            title: 'Email',
                            value: '587max@gmail.com',
                            href: 'mailto:587max@gmail.com',
                            style: 'text-black bg-white border-black hover:text-white hover:bg-black',
                            icon: <PiEnvelope size={24}  />
                        },
                        {
                            title: 'LinkedIn',
                            value: 'maxvink',
                            href: 'https://linkedin.com/in/maxvink',
                            style: 'text-blue-500 bg-white border-blue-500 hover:text-white hover:bg-blue-500',
                            icon: <FaLinkedin size={24}  />

                        },
                        {
                            title: 'GitHub',
                            value: 'mjv11',
                            href: 'https://github.com/mjv11',
                            style: 'text-gray-500 bg-white border-gray-500 hover:text-white hover:bg-gray-500',
                            icon: <FaGithub size={24}  />
                        },
                        {
                            title: 'Strava',
                            value: 'maxvink',
                            href: 'https://strava.com/maxvink',
                            style: 'text-orange-500 bg-white border-orange-500 hover:text-white hover:bg-orange-500',
                            icon: <FaStrava size={24}  />
                        },
                        {
                            title: 'Instagram',
                            value: 'm.axvink',
                            href: 'https://instagram.com/m.axvink',
                            style: 'text-pink-500 bg-white border-pink-500 hover:text-white hover:bg-pink-500',
                            icon: <FiInstagram size={24}  />
                        },
                    ].map((item) => (
                        <a key={item.title} href={item.href} className={`font-jost tracking-widest font-medium text-[16px] px-2 md:px-16 py-4 border-2 flex flex-row items-center justify-start gap-4 md:gap-16 ${item.style}`}>
                            {item.icon}
                            <div className='flex flex-row gap-2 items-center'>
                                <span className='whitespace-nowrap'>{item.title}: {item.value}</span>
                                <PiArrowSquareOutBold size={16} />
                            </div>
                        </a>
                    ))
                }
            </div>
        </div>
    )
}
