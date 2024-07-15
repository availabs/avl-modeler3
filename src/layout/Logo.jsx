import MNYLogo from './mny-logo'
import { Link } from 'react-router-dom'

const Logo = ({sideNav}) => {
	// const theme = useTheme()
	// const themeOptions = {
	// 	size: sideNav?.size || 'micro',
	// 	color: sideNav?.color || 'dark'
	// }

	return (
		<>
			<Link to="/" className={`flex  border-b`}>
				<div className='h-12 pl-4 pr-2 flex items-center '>
					<MNYLogo height={35} width={170} />
				</div>	
			</Link>
		</>
	)
}

export default Logo