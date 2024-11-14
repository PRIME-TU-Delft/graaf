
<div class="loader" />
<div class="loader" />
<div class="loader" />

<style lang="sass">

	@use 'sass:math'

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *
	
	$radius: 10px
	$diagonal: math.sqrt(2) * $radius
	$duration: 1.25s
		
	.loader
		position: absolute
		right: 50%
		bottom: 50%

		width: $diagonal
		height: $diagonal

		animation: figure-eight $duration infinite linear

		&:nth-child(2)
			animation-delay: -$duration / 3

		&:nth-child(3)
			animation-delay: -$duration / 1.5

		&::after
			content: ''

			position: absolute
			translate: -50% -50%
			top: 50%
			left: 50%

			width: 10px
			height: 10px
			border-radius: 50%
			background: $purple

	@keyframes figure-eight
		0%, 100%
			transform-origin: bottom right
			translate: $diagonal 0
			rotate: 0deg
		
		35%
			transform-origin: bottom right
			translate: $diagonal 0
			rotate: 270deg

		50%
			transform-origin: top left
			translate: 0 $diagonal
			rotate: 270deg
		
		85%
			transform-origin: top left
			translate: 0 $diagonal
			rotate: 0deg

</style>

<!-- .loader {
  width: calc(100px - 14px);
  height: 50px;
  border-radius: 50px;
  background: 
   radial-gradient(farthest-side,#0000 calc(100% - 15px),#ccc calc(100% - 14px) 99%,#0000) left,
   radial-gradient(farthest-side,#0000 calc(100% - 15px),#ccc calc(100% - 14px) 99%,#0000) right;
  background-size: calc(50% + 7px) 100%;
  background-repeat: no-repeat;
  position: relative;
  animation: l10-0 1s infinite linear;
}
.loader:before {
  content: "";
  position: absolute;
  inset: 0;
  margin: auto; 
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #f03355;
  transform-origin: -14px 50%;
  animation: l10-1 0.5s infinite linear;
}
@keyframes l10-0 { 
    0%,49.99% { transform:scaleX(1)}
    50%,100% { transform:scaleX(-1)} 
}
@keyframes l10-1 { 
    100% { transform:rotate(1turn)} 
}
 -->