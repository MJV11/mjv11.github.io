import { CornerBorders } from "../utils"

export const AboutPage = () => {
    return (
        <div className='absolute bottom-0 left-0 flex flex-col md:flex-row items-end justify-between w-full p-[14px]'>
            <div className='relative flex flex-col items-start justify-end w-[420px] px-[14px] pt-[14px] '>
                <span style={{ lineHeight: '.8', textShadow: '0px 0px 1px rgba(0, 0, 0, 0.1)' }} className="font-google-sans-code text-[#f3dbc7] text-center font-bold text-[80px] leading-none mb-2">Max Vink</span>
                <div className='flex flex-row items-end pt-[1vw]'>
                    <span style={{ textShadow: '0px 0px 1px rgba(0, 0, 0, 0.1)' }} className="font-tusker text-white text-center font-medium text-[175px] leading-none">CYCLIST</span>
                    <span style={{ textShadow: '0px 0px 1px rgba(0, 0, 0, 0.1)' }} className="font-google-sans-code text-[#f3dbc7] text-center font-bold text-[80px] leading-none mb-2">&</span>
                </div>
                <div className='flex flex-row items-end pt-[1vw]'>
                    <span style={{ textShadow: '0px 0px 1px rgba(0, 0, 0, 0.1)' }} className="font-tusker text-white text-center font-medium text-[175px] leading-none">ENGINEER</span>
                    <span style={{ textShadow: '0px 0px 1px rgba(0, 0, 0, 0.1)' }} className="font-google-sans-code text-[#f3dbc7] text-center font-bold text-[80px] leading-none mb-2">.</span>
                </div>
                <CornerBorders />
            </div>

            <div className='relative flex flex-col items-end justify-end w-3/5 px-[14px] py-[14px]'>
                <CornerBorders />
                {[
                    'I am a developer and cyclist based in Berkeley, CA.',
                    'I enjoy building software that is both functional and',
                    ' aesthetically pleasing. I love to race bikes, eat',
                    'carbohydrates, and read nonfiction.',
                ].map((line, index) => (
                    <span key={index} style={{ lineHeight: '1.1' }} className='font-semibold text-white text-right text-[30px]'>
                        {line}
                    </span>
                ))}
            </div>
        </div>
    )
}